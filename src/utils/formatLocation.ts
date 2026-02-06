export const formatLocationCount = (count: number | null): string => {
    if (count === null) return "確認中...";
    if (count === 0) return "登録者はまだいません";
    if (count < 5) return "5名未満";
    return `${count}名`;
};
