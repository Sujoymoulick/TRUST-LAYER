const axios = require('axios');
const crypto = require('crypto');

class CrifolayerSDK {
  /**
   * CrifolayerSDK Constructor
   * @param {Object} config
   * @param {string} config.apiKey - B2B Developer API Key (e.g. tl_sb_... or tl_prod_...)
   * @param {string} [config.baseUrl] - Custom base gateway endpoint URL
   * @param {number} [config.timeout] - Request timeout limit (defaults to 10000ms)
   * @param {number} [config.maxRetries] - Max automated exponential retries (defaults to 3)
   */
  constructor({ apiKey, baseUrl, timeout = 10000, maxRetries = 3 }) {
    if (!apiKey) {
      throw new Error('Crifolayer SDK Initialization Error: apiKey parameter is required.');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'http://localhost:5000/api/v1'; // Default local sandbox
    this.timeout = timeout;
    this.maxRetries = maxRetries;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    });
  }

  /**
   * _signRequest
   * Computes timing-safe HMAC-SHA256 payload signatures and attaches telemetry headers.
   */
  _signRequest(headers, body = {}) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body && Object.keys(body).length > 0 ? JSON.stringify(body) : '';
    const payload = `${timestamp}.${bodyString}`;

    // Compute HMAC using our API key as the cryptographic secret
    const signature = crypto
      .createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');

    return {
      ...headers,
      'X-TrustLayer-Signature': signature,
      'X-TrustLayer-Timestamp': timestamp
    };
  }

  /**
   * _executeWithRetry
   * Core request execution wrapper incorporating exponential backoff retries with randomized jitter.
   */
  async _executeWithRetry(requestFn, attempt = 0) {
    try {
      return await requestFn();
    } catch (err) {
      const status = err.response ? err.response.status : null;
      const isNetworkOrRateLimit = !status || status === 429 || (status >= 500 && status < 600);

      if (isNetworkOrRateLimit && attempt < this.maxRetries) {
        // Compute exponential backoff delay with randomized micro-jitter
        const baseDelay = 1000 * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        console.warn(`[Crifolayer SDK Warning]: Request failed (status: ${status || 'network_error'}). Retrying attempt ${attempt + 1}/${this.maxRetries} after ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._executeWithRetry(requestFn, attempt + 1);
      }
      
      // If exhausted or non-retryable error (e.g. 400, 401, 403, 404), throw detailed exception
      const errorMsg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : err.message;
      throw new Error(`Crifolayer SDK request failed: ${errorMsg}`);
    }
  }

  /**
   * getTrustScore
   * Retrieves computed trust scorecard and breakdowns for the target user.
   * @param {string} userId - Target user identifier
   */
  async getTrustScore(userId) {
    if (!userId) throw new Error('userId parameter is required.');
    
    const headers = this._signRequest({});
    return this._executeWithRetry(() => 
      this.client.get('/secure/trustscore', {
        params: { userId },
        headers
      }).then(res => res.data)
    );
  }

  /**
   * getPassport
   * Resolves decrypted identity passport metadata for target user.
   * @param {string} userId - Target user identifier
   */
  async getPassport(userId) {
    if (!userId) throw new Error('userId parameter is required.');

    const headers = this._signRequest({});
    return this._executeWithRetry(() => 
      this.client.get('/secure/passport', {
        params: { userId },
        headers
      }).then(res => res.data)
    );
  }

  /**
   * verifyIdentity
   * Triggers programmatic identity document validation engine.
   * @param {string} userId - Target user identifier
   * @param {string} documentType - Document tier type (PASSPORT, DRIVERS_LICENSE, NATIONAL_ID)
   * @param {string} documentData - Base64 encoded document image payload
   */
  async verifyIdentity(userId, documentType, documentData) {
    if (!userId || !documentType || !documentData) {
      throw new Error('Missing parameters: userId, documentType, and documentData are all required.');
    }

    const body = { userId, documentType, documentData };
    const headers = this._signRequest({}, body);

    return this._executeWithRetry(() => 
      this.client.post('/secure/verify-id', body, { headers })
        .then(res => res.data)
    );
  }

  /**
   * linkAccount
   * Connects third-party integration stats back to target user.
   * @param {string} userId - Target user identifier
   * @param {string} provider - Adapter service provider slug (e.g. gitlab, razorpay)
   * @param {Object} credentials - Integration secure auth context payload
   */
  async linkAccount(userId, provider, credentials) {
    if (!userId || !provider || !credentials) {
      throw new Error('Missing parameters: userId, provider, and credentials are all required.');
    }

    const body = { userId, provider, credentials };
    const headers = this._signRequest({}, body);

    return this._executeWithRetry(() => 
      this.client.post('/secure/link-account', body, { headers })
        .then(res => res.data)
    );
  }
}

module.exports = CrifolayerSDK;
export default CrifolayerSDK;
