import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, ShieldOff, KeyRound } from 'lucide-react';
import { isFirebaseReady } from '../../lib/firebase';
import {
  subscribeRiderRequests, fetchRiderRecords, approveRiderRequest,
  rejectRiderRequest, revokeRiderAccess
} from '../../services/riderAccessService';

const NEW_RIDER = '__new__';

/**
 * Admin card on Rider Monitoring: approve or decline rider sign-in
 * requests, and revoke access from riders who can currently sign in.
 */
export default function RiderAccessPanel() {
  const [requests, setRequests] = useState([]);
  const [records, setRecords]   = useState([]);
  const [choice, setChoice]     = useState({}); // request uid → rider id | NEW_RIDER
  const [busy, setBusy]         = useState(null);
  const [error, setError]       = useState('');

  const loadRecords = () => fetchRiderRecords().then(setRecords).catch(err => setError(err.message));

  useEffect(() => {
    if (!isFirebaseReady()) return;
    loadRecords();
    return subscribeRiderRequests(setRequests);
  }, []);

  if (!isFirebaseReady()) return null;

  const pending  = requests.filter(r => r.status === 'pending');
  const declined = requests.filter(r => r.status === 'rejected');
  const linked   = records.filter(r => r.user_id);
  const unlinked = records.filter(r => !r.user_id);

  const run = async (key, action) => {
    setBusy(key);
    setError('');
    const { error: actionError } = await action();
    if (actionError) setError(actionError);
    await loadRecords();
    setBusy(null);
  };

  const row = { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 0', borderTop: '1px solid var(--border-color, rgba(0,0,0,0.08))' };
  const who = (name, email) => (
    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
      <div style={{ fontWeight: 700, color: 'var(--charcoal-900)' }}>{name || 'Unnamed'}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{email}</div>
    </div>
  );
  const small = { fontSize: '0.8rem', padding: '0.4rem 0.75rem' };

  return (
    <div className="card" style={{ padding: '1.1rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--charcoal-900)' }}>
        <KeyRound size={18} color="var(--gold-600)" /> Rider sign-in access
        {pending.length > 0 && (
          <span style={{ background: 'var(--status-danger)', color: '#fff', borderRadius: 999, fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
            {pending.length} waiting
          </span>
        )}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0.5rem' }}>
        Anyone who signs in on the rider portal appears here. Only approved accounts can open the rider terminal.
      </p>

      {error && <p style={{ color: 'var(--status-danger)', fontSize: '0.8rem' }}>{error}</p>}

      {pending.length === 0 && <p style={{ ...row, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No requests waiting.</p>}
      {pending.map(req => (
        <div key={req.uid} style={row}>
          {who(req.name, req.email)}
          <select
            value={choice[req.uid] || NEW_RIDER}
            onChange={e => setChoice(c => ({ ...c, [req.uid]: e.target.value }))}
            style={{ ...small, borderRadius: 8, maxWidth: '100%' }}
            aria-label="Rider profile to link"
          >
            <option value={NEW_RIDER}>New rider profile</option>
            {unlinked.map(r => <option key={r.id} value={r.id}>Link to {r.name} ({r.id})</option>)}
          </select>
          <button className="btn btn-primary" style={small} disabled={busy === req.uid}
            onClick={() => run(req.uid, () => approveRiderRequest(req, choice[req.uid] && choice[req.uid] !== NEW_RIDER ? choice[req.uid] : null))}>
            <UserCheck size={14} /> Approve
          </button>
          <button className="btn btn-outline" style={small} disabled={busy === req.uid}
            onClick={() => run(req.uid, () => rejectRiderRequest(req.uid))}>
            <UserX size={14} /> Decline
          </button>
        </div>
      ))}

      {linked.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '1rem 0 0' }}>Can sign in</h3>
          {linked.map(r => (
            <div key={r.id} style={row}>
              {who(r.name, r.email)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.id} · {r.account_status}</span>
              <button className="btn btn-outline" style={small} disabled={busy === r.id}
                onClick={() => window.confirm(`Stop ${r.name} from signing in as a rider?`) && run(r.id, () => revokeRiderAccess(r))}>
                <ShieldOff size={14} /> Revoke
              </button>
            </div>
          ))}
        </>
      )}

      {declined.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '1rem 0 0' }}>Declined</h3>
          {declined.map(req => (
            <div key={req.uid} style={row}>
              {who(req.name, req.email)}
              <button className="btn btn-outline" style={small} disabled={busy === req.uid}
                onClick={() => run(req.uid, () => approveRiderRequest(req, null))}>
                <UserCheck size={14} /> Approve instead
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
