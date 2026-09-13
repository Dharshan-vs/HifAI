import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [auditRes, offersRes, usersRes, txRes] = await Promise.all([
      query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50'),
      query('SELECT * FROM energy_offers ORDER BY id DESC LIMIT 50'),
      query('SELECT * FROM users ORDER BY id ASC LIMIT 50'),
      query('SELECT * FROM energy_transactions ORDER BY id DESC LIMIT 50'),
    ]);

    const auditLogs = auditRes.rows || [];
    const offers = offersRes.rows || [];
    const users = usersRes.rows || [];
    const transactions = txRes.rows || [];

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YUGA / HifAI Database Explorer</title>
  <style>
    :root {
      --primary: #10b981;
      --navy: #0f172a;
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
    }
    .header {
      background: linear-gradient(135deg, #0f766e, #065f46);
      color: white;
      padding: 24px 32px;
      border-radius: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
    }
    .header h1 { font-size: 22px; font-weight: 800; }
    .header p { font-size: 13px; opacity: 0.9; margin-top: 4px; }
    .badge {
      background: rgba(255,255,255,0.2);
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 10px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text);
    }
    tr:hover { background: #f8fafc; }
    .hash {
      font-family: monospace;
      font-size: 11px;
      color: #0f766e;
      background: #f0fdf4;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-verified, .status-active, .status-completed {
      background: #dcfce7;
      color: #15803d;
    }
    .status-pending {
      background: #fef3c7;
      color: #b45309;
    }
    .status-cancelled {
      background: #ffe4e6;
      color: #be123c;
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1>⚡ PostgreSQL Database Explorer</h1>
      <p>Visual table viewer for YUGA / HifAI Decentralized Energy Marketplace</p>
    </div>
    <div class="badge">Live Connection Active</div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="showTab('audit')">📜 Blockchain Ledger (audit_logs) [${auditLogs.length}]</button>
    <button class="tab-btn" onclick="showTab('offers')">🔋 Energy Offers (energy_offers) [${offers.length}]</button>
    <button class="tab-btn" onclick="showTab('tx')">💳 Transactions (energy_transactions) [${transactions.length}]</button>
    <button class="tab-btn" onclick="showTab('users')">👤 Users (users) [${users.length}]</button>
  </div>

  <!-- 1. Audit Logs -->
  <div id="tab-audit" class="card tab-content">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tx Ref</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Amount</th>
            <th>Status</th>
            <th>SHA-256 Blockchain Hash</th>
            <th>Description</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${auditLogs.map(a => `
            <tr>
              <td><strong>#${a.id}</strong></td>
              <td style="font-family: monospace; font-weight: bold;">${a.transaction_id || '-'}</td>
              <td><strong>${a.actor || '-'}</strong></td>
              <td><span class="status-badge status-${(a.action || '').toLowerCase()}">${a.action || '-'}</span></td>
              <td style="font-family: monospace; font-weight: bold;">₹${parseFloat(a.amount || 0).toFixed(2)}</td>
              <td><span class="status-badge status-${(a.status || 'verified').toLowerCase()}">${a.status || 'verified'}</span></td>
              <td><span class="hash" title="${a.blockchain_hash}">${a.blockchain_hash || '-'}</span></td>
              <td style="max-width: 250px; font-size: 11px;">${a.description || '-'}</td>
              <td style="font-size: 11px; color: var(--muted);">${new Date(a.timestamp).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 2. Energy Offers -->
  <div id="tab-offers" class="card tab-content" style="display: none;">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Seller Name</th>
            <th>Total kWh</th>
            <th>Remaining kWh</th>
            <th>Price / kWh</th>
            <th>Source</th>
            <th>Location</th>
            <th>City</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${offers.map(o => `
            <tr>
              <td><strong>#${o.id}</strong></td>
              <td><strong>${o.seller_name || 'Producer'}</strong></td>
              <td style="color: #10b981; font-weight: bold;">${o.energy_kwh} kWh</td>
              <td style="color: #0f766e; font-weight: bold;">${o.remaining_kwh} kWh</td>
              <td style="font-family: monospace; font-weight: bold;">₹${parseFloat(o.price_per_kwh).toFixed(2)}</td>
              <td>${o.energy_source || 'Solar'}</td>
              <td style="font-size: 11px;">${o.seller_location || '-'}</td>
              <td>${o.seller_city || 'Dindigul'}</td>
              <td><span class="status-badge status-${(o.status || 'active').toLowerCase()}">${o.status || 'active'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 3. Transactions -->
  <div id="tab-tx" class="card tab-content" style="display: none;">
    <div class="table-container">
      ${transactions.length === 0 ? '<div class="empty">No completed transactions in database yet. Trades will appear here once purchased.</div>' : `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Seller ID</th>
              <th>Buyer ID</th>
              <th>Offer ID</th>
              <th>Energy (kWh)</th>
              <th>Price/kWh</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => `
              <tr>
                <td><strong>#${t.id}</strong></td>
                <td>${t.seller_id}</td>
                <td>${t.buyer_id}</td>
                <td>#${t.energy_offer_id || '-'}</td>
                <td style="color: #10b981; font-weight: bold;">${t.energy_kwh} kWh</td>
                <td>₹${t.price_per_kwh}</td>
                <td style="font-weight: bold; font-family: monospace;">₹${t.total_amount}</td>
                <td><span class="status-badge status-${(t.status || 'pending').toLowerCase()}">${t.status || 'pending'}</span></td>
                <td style="font-size: 11px; color: var(--muted);">${new Date(t.created_at).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  </div>

  <!-- 4. Users -->
  <div id="tab-users" class="card tab-content" style="display: none;">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Firebase UID</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><strong>#${u.id}</strong></td>
              <td><strong>${u.name || '-'}</strong></td>
              <td>${u.email || '-'}</td>
              <td><span class="status-badge status-active">${u.role || 'consumer'}</span></td>
              <td style="font-family: monospace; font-size: 11px; color: var(--muted);">${u.firebase_uid || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    function showTab(name) {
      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      const activeTab = document.getElementById('tab-' + name);
      if (activeTab) activeTab.style.display = 'block';
      event.target.classList.add('active');
    }
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send(`<h3>Error loading tables: ${error.message}</h3>`);
  }
});

export default router;
