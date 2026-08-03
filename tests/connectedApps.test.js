const { db: prisma } = require('../backend/db/prismaClientWrapper');
const oauthController = require('../backend/controllers/oauthController');

// Mock request and response objects
const mockRequest = (userId, params = {}) => ({
  user: { id: userId },
  params
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

describe('Connected Apps Management Tests', () => {
  let mockUserId = 'test-user-id';

  beforeAll(async () => {
    // Setup mock user
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: { id: mockUserId, email: 'test@crifolayer.io', fullName: 'Test User' }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: mockUserId } }).catch(() => {});
  });

  beforeEach(async () => {
    await prisma.connectedAccount.deleteMany({ where: { userId: mockUserId } });
    await prisma.auditLog.deleteMany({ where: { userId: mockUserId } });
  });

  it('should list connected apps in summary', async () => {
    await prisma.connectedAccount.create({
      data: {
        userId: mockUserId,
        provider: 'github',
        providerAccountId: 'github-test-123',
        status: 'CONNECTED',
      }
    });

    const req = mockRequest(mockUserId, { userId: mockUserId });
    const res = mockResponse();

    await oauthController.getSummary(req, res);

    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.connectedAccounts.length).toBe(1);
    expect(responseData.connectedAccounts[0].provider).toBe('github');
  });

  it('should unlink provider and revoke tokens successfully', async () => {
    await prisma.connectedAccount.create({
      data: {
        userId: mockUserId,
        provider: 'google',
        providerAccountId: 'google-test-123',
        status: 'CONNECTED',
      }
    });

    const req = mockRequest(mockUserId, { provider: 'google' });
    const res = mockResponse();

    await oauthController.revokeProvider(req, res);

    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.message).toContain('Successfully disconnected');

    // Verify it was deleted
    const accounts = await prisma.connectedAccount.findMany({ where: { userId: mockUserId, provider: 'google' } });
    expect(accounts.length).toBe(0);

    // Verify AuditLog was created
    const logs = await prisma.auditLog.findMany({ where: { userId: mockUserId } });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('REVOKE_GOOGLE_CONNECTION');
    expect(logs[0].details.action).toBe('UNLINK_SUCCESS');
  });

  it('should return 404 for unlinking non-existent provider', async () => {
    const req = mockRequest(mockUserId, { provider: 'nonexistent' });
    const res = mockResponse();

    await oauthController.revokeProvider(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String)
    }));
  });

  it('should return 403 when trying to fetch summary for another user', async () => {
    const req = mockRequest(mockUserId, { userId: 'another-user-id' });
    const res = mockResponse();

    await oauthController.getSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Access denied')
    }));
  });
});
