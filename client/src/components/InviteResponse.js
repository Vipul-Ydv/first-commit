import React, { useState } from 'react';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import * as api from '../api';

/**
 * Accept / decline controls for an invitation a team has already sent you.
 *
 * This deliberately takes the place of the join button rather than sitting
 * beside it: offering "Request to join" to someone who is already holding an
 * invitation from that team reads as a bug, and sending the request would be
 * rejected as a duplicate anyway.
 */
export default function InviteResponse({ invitation, onDone, size = 'sm' }) {
  const [busy, setBusy] = useState(null);

  const pad = size === 'lg' ? 'px-3.5 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  const ico = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const spin = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  const act = async (kind, call, msg) => {
    setBusy(kind);
    try {
      await call(invitation.invitationId);
      toast.success(msg);
      await onDone?.();
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault(); e.stopPropagation();
          act('accept', api.acceptInvitation, 'Invitation accepted!');
        }}
        disabled={busy !== null}
        className={`btn-primary flex items-center gap-1 ${pad}`}
      >
        {busy === 'accept'
          ? <span className={`inline-block ${spin} border-2 border-white border-t-transparent rounded-full animate-spin`} />
          : <HiCheckCircle className={ico} />}
        Accept
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault(); e.stopPropagation();
          act('decline', api.declineInvitation, 'Invitation declined.');
        }}
        disabled={busy !== null}
        className={`btn-secondary flex items-center gap-1 ${pad}`}
      >
        {busy === 'decline'
          ? <span className={`inline-block ${spin} border-2 border-gray-500 border-t-transparent rounded-full animate-spin`} />
          : <HiXCircle className={ico} />}
        Decline
      </button>
    </div>
  );
}
