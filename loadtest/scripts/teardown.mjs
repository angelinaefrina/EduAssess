// Bersihkan semuanya setelah load test:
//   1. data asesmen & cache rekomendasi akun dummy
//   2. akun dummy (auth.users -> profil -> siswa -> ... ikut terhapus via CASCADE)
//   3. seri metrik k6 di Prometheus
//   4. token & daftar akun lokal (.data/)
// Folder results/ (PNG, HTML, report.md) TIDAK dihapus.
//
//   node scripts/teardown.mjs [--keep-metrics] [--keep-users]
import { rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { cleanupData } from './cleanup-data.mjs';
import {
  cfg,
  DATA_DIR,
  deletePrometheusSeries,
  listLoadtestUsers,
  log,
  pool,
  prometheusReady,
  requireLocalSupabase,
  sb,
} from './lib.mjs';

export async function teardown({ keepMetrics = false, keepUsers = false } = {}) {
  requireLocalSupabase();
  await cleanupData();

  if (!keepUsers) {
    const users = await listLoadtestUsers();
    log(`Menghapus ${users.length} akun dummy`);
    let gagal = 0;
    await pool(users, cfg.concurrency, async (u) => {
      const r = await sb('DELETE', `/auth/v1/admin/users/${u.id}`);
      if (!r.ok && r.status !== 404) {
        gagal++;
        console.error(`  gagal hapus ${u.email} (${r.status})`);
      }
    });
    log(gagal ? `${gagal} akun gagal dihapus, jalankan ulang teardown` : 'Akun dummy terhapus');
    rmSync(DATA_DIR, { recursive: true, force: true });
  }

  if (!keepMetrics) {
    if (await prometheusReady()) {
      await deletePrometheusSeries();
      log('Metrik k6 di Prometheus dihapus');
    } else {
      log(`Prometheus tidak bisa dihubungi di ${cfg.prometheusUrl}; lewati hapus metrik (atau: npm run stack:purge)`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Set(process.argv.slice(2));
  await teardown({ keepMetrics: args.has('--keep-metrics'), keepUsers: args.has('--keep-users') });
}
