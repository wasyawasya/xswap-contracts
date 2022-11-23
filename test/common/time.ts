export const deadlineHours = (hours: number): number => {
  const now = Math.ceil(new Date().getTime() / 1000);
  const ttl = hours * 60 * 60;
  const deadline = now + ttl;
  return deadline;
};
