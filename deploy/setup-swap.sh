#!/usr/bin/env bash
# Recommended for 4GB EC2: adds 1GB swap so Next.js builds don't OOM.
# On a 8GB+ disk, use 2G instead: fallocate -l 2G /swapfile
set -euo pipefail

if swapon --show | grep -q '/swapfile'; then
  echo "Swap already enabled."
  swapon --show
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash deploy/setup-swap.sh"
  exit 1
fi

SWAP_SIZE="${SWAP_SIZE:-1G}"
fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

if ! grep -q '/swapfile' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

sysctl vm.swappiness=10
grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "Swap enabled:"
free -h
