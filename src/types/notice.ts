/** Firestore `notices` コレクションのドキュメント型 */
export interface Notice {
  id: string;
  userId: string;
  message: string;
  type:
    | "application_received" // 誰かが応募してきた
    | "wish_cancelled"       // 願いがキャンセルされた
    | "helper_resigned"      // 助け手が辞退した
    | "user_deleted"         // 相手が退会した
    | "wish_approved"        // 応募が承認された
    | "wish_fulfilled"       // 願いが完了した
    | "system";              // システム通知
  createdAt: number; // Date.now() ベースのミリ秒
  read?: boolean;
}

/** Firestore に書き込むときの入力型（id は自動生成） */
export type CreateNoticeInput = Omit<Notice, "id">;
