export function gracefullyExit() {
  process.kill(process.pid, 'SIGTERM');
}

export function formatSize(size) {
  let level = 0;
  while (size >= 1024) {
    level ++;
    size /= 1024;
  }
  // Bytes 1B = 2^3 bit
  // Kilo Bytes 1KB = 2^10 B
  // Mega Bytes 1MB = 2^10 KB
  // Giga Bytes 1GB = 2^10 MB
  // Tera Bytes 1TB = 2^10 GB
  // Peta Bytes 1PB = 2^10 TB
  // Hexa Bytes 1EB = 2^10 PB
  // Zetta Bytes 1ZB = 2^10 EB
  // Yotta Bytes 1YB = 2^10 ZB
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB'];
  return `${size.toFixed(2)} ${units[level]}`;
}
