import { useOutletContext } from 'react-router-dom';

interface DashboardContextType {
  plan: string | null;
  status: string;
  isOwner: boolean;
}

export function useDashboardContext() {
  return useOutletContext<DashboardContextType>();
}
