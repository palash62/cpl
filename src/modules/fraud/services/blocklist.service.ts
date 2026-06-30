import { listBlocklist, addBlocklistIp, removeBlocklistIp } from "../repositories/blocklist.repo";

export { listBlocklist, addBlocklistIp, removeBlocklistIp };

export async function listBlocklistIps(page = 1, limit = 50) {
  return listBlocklist(page, limit);
}
