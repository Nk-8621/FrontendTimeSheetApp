import { useQuery } from '@tanstack/react-query';
import { teamApi } from '../../api/team';
import { useSession } from '../../session/SessionContext';

export function useTeamCompliance(weekStart: string) {
  const { isAdmin } = useSession();

  return useQuery({
    queryKey: ['team-compliance', weekStart, isAdmin],
    queryFn: () => (isAdmin ? teamApi.getComplianceAll(weekStart) : teamApi.getCompliance(weekStart)),
  });
}