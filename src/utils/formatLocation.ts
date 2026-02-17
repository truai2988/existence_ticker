export const formatLocationCount = (count: number | string | null | undefined): string => {
  if (count === null || count === undefined) return "確認中...";
  const numCount = Number(count);
  if (isNaN(numCount)) return "エラー";
  if (numCount === 0) return "登録者はまだいません";
  if (numCount < 5) return "5名未満";
  return `${numCount}名`;
};
