import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

/**
 * The signed-in user's pending invitations, keyed by teamId.
 *
 * A team that has already invited you must never offer "Request to join" -
 * you are being asked, not asking. Both the browse list and the team page
 * need that fact and neither otherwise loads the dashboard, so the lookup
 * lives here instead of being duplicated in each.
 */
export default function usePendingInvites() {
  const { user } = useAuth();
  const [byTeam, setByTeam] = useState({});

  const reload = useCallback(async () => {
    if (!user?.userId) return {};
    try {
      const data = await api.getIndividualDashboard(user.userId);
      const map = {};
      for (const inv of data.receivedInvitations || []) {
        if (inv.status === 'pending' && inv.teamId) map[inv.teamId] = inv;
      }
      setByTeam(map);
      return map;
    } catch {
      // Never fatal. Without it the pages just fall back to "Request to join",
      // which is wrong but harmless - not worth an error toast on page load.
      return {};
    }
  }, [user?.userId]);

  useEffect(() => { reload(); }, [reload]);

  return { byTeam, reload };
}
