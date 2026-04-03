export const MESSAGES = {
  // 1. 基盤・通知・エラー関連 (Hooks / Utils)
  SYSTEM: {
    PWA_INSTALL_PROMPT: "アプリをインストールしますか？",
    PWA_INSTALL_WARNING: "ブラウザの設定からインストールを行ってください。",
    ERROR_AUTH_INIT: "認証システムに接続できませんでした。",
    ERROR_DB_INIT: "データベースとの接続が途切れました。",
    ERROR_NETWORK: "通信が不安定なようです。少し待ってから、もう一度お試しください。",
    ERROR_GENERIC: "予期せぬエラーが発生しました。再接続しています...",
    STATS_FETCH_FAILED: "統計データの取得に失敗しました。",
    NOTICE_WISH_APPLIED: "あなたの願いに、誰かが寄り添おうとしています。", // 応募（承認前）
    NOTICE_WISH_APPROVED: "あなたの願いが、静かに聞き届けられました。", // 承認された（助け手側）
    NOTICE_REVIEW_PENDING: "願いが叶い、感謝の言葉を待っています。", // 完了報告（依頼主側）
    NOTICE_WISH_FULFILLED: "感謝と共に、源気が届けられました。", // 決済完了（助け手側）
    NOTICE_WISH_CANCELLED: "願いは取り下げられ、源気（Lm）が手元に戻りました。",
    NOTICE_HELPER_RESIGNED: "担当者が離れ、願いは再び世界へと還りました。",
    LOCATION_FORMAT_CHECKING: "確認中...",
    LOCATION_FORMAT_ERROR: "取得エラー",
    LOCATION_FORMAT_EMPTY: "0名",
    LOCATION_FORMAT_FEW: "数名",
    LOCATION_FORMAT_COUNT: "名",
    ERROR_UNKNOWN: "不明なエラー",
    BTN_CLOSE: "閉じる",
    // Existence Ticker
    TICKER_PHASE_FULL: "源気が満ちました",
    TICKER_PHASE_HALF: "静かな減価",
    TICKER_PHASE_NEW: "源気が尽きました",
    TICKER_REIGNITION: "【初期化完了】",
    // Error Boundary
    ERROR_BOUNDARY_TITLE: "エラーが発生しました",
    ERROR_BOUNDARY_DESC: "申し訳ありません。予期せぬ問題により画面を表示できませんでした。\n一度ページを再読み込み（リロード）してみてください。",
    ERROR_BOUNDARY_BTN: "ページを再読み込みする",
  },

  // 1.5. 診断関連 (useDiagnostics)
  DIAGNOSTICS: {
    STATUS_LOADING: "データを読み込み中",
    PHASE_STARVATION_SHORT: "残高低下", 
    PHASE_STARVATION_LONG: "システム全体の残高が低下しています。",
    PHASE_SATURATION_SHORT: "流動性低下", 
    PHASE_SATURATION_LONG: "資産が滞留しており、取引が発生していません。",
    PHASE_STAGNATION_SHORT: "取引停止", 
    PHASE_STAGNATION_LONG: "システム内での取引が確認できません。",
    PHASE_HEALTHY_SHORT: "正常稼働", 
    MICRO_PREFIX: "[Micro]",
    ANOMALY_NEGATIVE_BALANCE: "エラー：残高がマイナス",
    ANOMALY_DATA_CORRUPTION: "エラー：データ破損",

    // DiagnosticModal Specifics
    SAGE_TITLE: "システム診断結果",
    LBL_SPEED: "流通速度",
    LBL_SAVINGS: "平均残高",
    LBL_DECAY: "減価する源気",
    LBL_PRESCRIPTION: "推奨アクション",
    BTN_ADJUST: "設定の変更",
    BTN_EXECUTE: "実行する",
    FOOTER_TICKER: "Existence Ticker",
    FOOTER_RULE: "利用規約",

    STARVATION_VOICE: "システムの流動性が著しく低下しています。平均残高: %s Lm。\nパラメータを調整して流通を促進してください。",
    STARVATION_TITLE: "配布サイクルの短縮",
    STARVATION_DESC: "サイクル期間を短縮（5～7日）し、ユーザーへの給付頻度を増加させます。",
    STARVATION_TARGET: "目標: 5日",
    
    SATURATION_VOICE: "システム内にトークンが滞留しています。%s% のユーザーが上限に達しています。\nパラメータを調整して消費を促進してください。",
    SATURATION_TITLE: "配布サイクルの延長",
    SATURATION_DESC: "サイクル期間を延長（15～20日）し、インフレを抑制します",
    SATURATION_TARGET: "目標: 20日",

    STAGNATION_VOICE: "アクティブな取引が存在しません。\n初期ユーザーとして取引を開始するか、システム設定を見直してください。",
    STAGNATION_TITLE: "取引の手動実行",
    STAGNATION_DESC: "管理者権限を用いて手動でトランザクションを発生させます。",
    STAGNATION_TARGET: "操作: トランザクション生成",

    HEALTHY_VOICE: "システムは正常なパラメータ範囲内で稼働しています。",
    HEALTHY_TITLE: "ステータスの維持",
    HEALTHY_DESC: "現在のパラメータ設定を維持します。",
    HEALTHY_TARGET: "操作: なし",

    MICRO_VOICE: "[Micro構成]\n%s\n小規模なユーザー数での動作を確認中。",
    MICRO_DESC: "[Micro構成] %s 小規模環境用のパラメータが適用されます。",
  },

  // 1.8. 認証エラー関連 (useAuthHook)
  AUTH_ERROR: {
    INVALID_INVITE_CODE: "無効な招待コードです",
    USED_INVITE_CODE: "使用済みの招待コードです",
    USER_EXISTS: "ユーザーは既に存在します",
    SIGNUP_FAILED: "登録処理に失敗しました",
    NO_USER_TO_LINK: "リンクするユーザーが存在しません",
    NOT_AUTHENTICATED: "未認証です",
    NO_EMAIL: "メールアドレスが設定されていません",
  },

  // 1.9. 願いアクション関連 (useWishActions)
  WISH_ACTION: {
    ERROR_UNAUTHORIZED: "権限がありません",
    ERROR_INSUFFICIENT_FUNDS: "残高が不足しています",
    ERROR_NOT_FOUND: "該当データが見つかりません",
    ERROR_ALREADY_APPLIED: "既に応募済みです",
    ERROR_ALREADY_FULFILLED: "既に完了しています",
    ERROR_APPLY_FAILED: "応募処理に失敗しました",
    ERROR_UPDATE_FAILED: "更新処理に失敗しました",
    ERROR_FULFILL_FAILED: "完了処理に失敗しました",
    ERROR_WITHDRAW_FAILED: "取り消し処理に失敗しました",
    DEFAULT_SENDER_NAME: "送信者",
    DEFAULT_RECIPIENT_NAME: "受信者",
    LOG_CANCEL_COMPENSATION_SENT: "キャンセルに伴う補償を送信しました",
    LOG_CANCEL_COMPENSATION_RECEIVED: "キャンセルに伴う補償を受信しました",
    LOG_CANCEL_NO_COMPENSATION: "項目をキャンセルしました",
    LOG_FULFILL_BANKRUPTCY_SENDER: "残高不足のため一部のみ決済されました",
    LOG_FULFILL_BANKRUPTCY_RECEIVER: "送信者の残高不足のため一部のみ受信しました",
    LOG_FULFILL_PRICELESS_SENDER: "無償の処理が完了しました",
    LOG_FULFILL_PRICELESS_RECEIVER: "無償の処理が完了しました",
    LOG_FULFILL_NORMAL_SENDER: "決済が完了しました",
    LOG_FULFILL_NORMAL_RECEIVER: "決済を受信しました",
  },

  // 2. 認証・オンボーディング関連 (AuthScreen / OnboardingStory)
    AUTH: {
    APP_TITLE: "イグジスタンス・ティッカー",
    REIGNITE_TITLE: "アカウント復旧",
    NAME_LABEL: "氏名",
    EMAIL_LABEL: "メールアドレス",
    PASSWORD_LABEL: "パスワード",
    LOCATION_LABEL: "居住地",
    AGE_LABEL: "年齢層",
    GENDER_LABEL: "性別",
    INVITE_LABEL: "招待コード入力",
    INVITE_HELP: "招待コードを入力してください。",
    LOGIN_BUTTON: "ログイン",
    SIGNUP_BUTTON: "新規登録",
    REIGNITE_BUTTON: "パスワードリセット",
    TO_SIGNUP: "新規アカウント作成",
    TO_FORGOT: "パスワードを忘れた場合",
    TO_LOGIN: "ログイン画面へ",
    WELCOME_TITLE: "システムログイン",
    PW_RESET_SENT: "パスワード再設定メールを送信しました",
    PW_RESET_HELP: "メールが届かない場合は、迷惑メールフォルダもご確認ください。",
    GHOST_PURGE_FEEDBACK: "前回のアカウントは正常に作成されていませんでした。お手数ですが、再度登録をお願いします。",
    TO_LOGIN_BACK: "ログイン画面に戻る",
    WELCOME_MSG_1: "あなたの存在を、",
    WELCOME_MSG_2: "このインフラは歓迎します",
    CITY_LOADING: "...",
    EMAIL_REQUIRED: "メールアドレスを入力してください。",
    EMAIL_INVALID: "メールアドレスの形式が正しくありません。",
    PASSWORD_REQUIRED: "パスワードを入力してください。",
    NAME_REQUIRED: "名前を入力してください。",
    GENDER_REQUIRED: "性別を選択してください。",
    AGE_GROUP_REQUIRED: "年代を選択してください。",
    PREFECTURE_REQUIRED: "都道府県を選択してください。",
    CITY_REQUIRED: "市区町村を選択してください。",
    PASSWORD_WEAK: "パスワードは6文字以上で入力してください。",
    INVITE_REQUEST: "招待コードを入力してください。",
    NAME_PLACEHOLDER: "山田 太郎",
    EMAIL_PLACEHOLDER: "mail@example.com",
    PASSWORD_PLACEHOLDER: "••••••",
    RESIDENCE_LABEL: "居住地",
    PREFECTURE_PLACEHOLDER: "都道府県",
    CITY_PLACEHOLDER: "市区町村",
    RESIDENCE_HELP: "※番地やマンション名の入力は不要です。",
    AGE_GROUP_LABEL: "年代",
    AGE_GROUP_PLACEHOLDER: "年代",
    AGE_GROUP_UNDER_20: "20歳未満",
    AGE_GROUP_20S: "20代",
    AGE_GROUP_30S: "30代",
    AGE_GROUP_40S: "40代",
    AGE_GROUP_50S: "50代",
    AGE_GROUP_60S: "60代",
    AGE_GROUP_70S: "70代",
    AGE_GROUP_OVER_80: "80代以上",
    GENDER_PLACEHOLDER: "性別",
    GENDER_MALE: "男性",
    GENDER_FEMALE: "女性",
    GENDER_OTHER: "その他",
    INVITE_PLACEHOLDER: "ALPHA-XXXX",
    FIREBASE_ERRORS: {
      "auth/invalid-email": "メールアドレスの形式が正しくありません。",
      "auth/user-disabled": "このアカウントは無効化されています。",
      "auth/user-not-found": "メールアドレスまたはパスワードが正しくありません。",
      "auth/wrong-password": "メールアドレスまたはパスワードが正しくありません。",
      "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
      "auth/email-already-in-use": "このメールアドレスは既に登録されています。",
      "auth/weak-password": "パスワードは6文字以上で入力してください。",
      "auth/operation-not-allowed": "認証エラーが発生しました。管理者にお問い合わせください。",
      "auth/too-many-requests": "アクセスが集中しています。しばらく待ってから再度お試しください。",
      "auth/network-request-failed": "回線が不安定です。ネットワーク接続を確認してください。",
      "auth/internal-error": "システムエラーが発生しました。",
      "auth/requires-recent-login": "再認証が必要です。一度ログアウトして再度ログインしてください。",
    }
  },

  // 3. メインビュー関連 (Home / Flow / Journal)
  HOME: {
    MONOTONE_MSG_1: "タップしてください",
    BTN_RESPOND: "お返事",
    BTN_REQUEST: "お願い",
    BTN_UNDERSTOOD: "確認",
    DECAY_LABEL: "Lm",
    AVAILABLE_LM: "つかえる Lm",
    TICKER_BUTTON: "刻む",
    BTN_NEW_WISH: "新規作成",
    LBL_WISH: "お願い",
    LBL_SHARE: "お願い",
    TAB_SEARCHING: "アクティブ",
    TAB_IN_PROGRESS: "進行中",
    TXT_NO_HISTORY: "活動記録はありません。",
    ARIA_BACK_HOME: "ホームへ戻る",
    ARIA_OPEN_MENU: "メニューを開く",
  },
  
  WISH_ACTIONS: {
    FALLBACK_REQUESTER: "依頼主",
    FALLBACK_HELPER: "助力者",
    FALLBACK_PLAYER: "魂の奏者",
    FALLBACK_APPLICANT: "奏者",
    PENDING_PROPAGATION: "伝搬中...",
    NOTICE_APPROVED: "あなたの願いが、静かに聞き届けられました。",
    NOTICE_FULFILLED: "感謝と共に、Lmが届けられました。",
    NOTICE_COMPLETION_PENDING: "願いが叶い、感謝の言葉を待っています。",
    NOTICE_HELPER_RESIGNED: "担当者が離れ、願いは再び世界へと還りました。",
    NOTICE_REQUESTER_CANCEL: "依頼主様のご都合により願いが中断されました。しるしとしてLmが補償されています。",
    NOTICE_HELPER_WAIT_RETURN: "助け手様が辞退されたため、願いが再び募集に戻りました。Lmは安全に守られています。",
    NOTICE_APPLICATION: "%nameさんが寄り添おうとしています。",
    DESC_COMP_SENDER: "中断に伴い、誠実のしるしをお渡ししました",
    DESC_COMP_RECV: "依頼主の中断に伴い、誠実のしるしが届きました",
    DESC_CANCELLED: "願いを取り下げました",
    DESC_WISH_PRICELESS: "想いが巡りました（Priceless）",
    DESC_WISH_FULFILL_SENDER: "願いを叶えてくれた感謝を、Lmに込めて贈りました",
    DESC_WISH_FULFILL_RECV: "感謝が結晶（Lm）になって届きました",
    DESC_WISH_BANKRUPT_SENDER: "感謝を贈りましたが、余力が足りず一部のみが結晶になりました",
    DESC_WISH_BANKRUPT_RECV: "感謝が届きましたが、余力が足りず一部のみが結晶になりました",
    SYS_NOTE_REOPEN: "事情により、願いが再び募集されています。",
    SYS_NOTE_REOPEN2: "事情により、願いが再度募集されています。",
    ALERT_DB_ERROR: "データベースエラー: 接続されていません。",
    ALERT_NOT_LOGGED_IN: "エラー: ログインしていません。",
    ALERT_APPLY_FAILED: "応募に失敗しました",
    ALERT_UPDATE_FAILED: "更新に失敗した:",
    ALERT_FULFILL_FAILED: "感謝の巡りに失敗しました:",
    ALERT_CAST_FAILED: "願いを届けることができませんでした:",
    INSUFFICIENT_FUNDS: "手持ちが不足しています",
  },

  FLOW: {
    TITLE: "お返事", 
    SUBTITLE: "",
    TAB_EXPLORE: "新しい願い",            // 「漂う」を「新しい」に変更（直感性重視）
    TAB_PENDING: "承諾待ち",             // 「応え待ち」を「承諾（Agree）待ち」へ
    TAB_ACTIVE: "進行中の願い",           // 「寄り添い中」という言葉の後に「進行中」を添える
    EMPTY_EXPLORE: "新しい願いはまだありません",
    EMPTY_PENDING: "承諾を待っている願いはありません",
    EMPTY_ACTIVE: "現在、進行中の願いはありません",
    LOAD_MORE: "さらに読み込む",          // 「過去へ」より動作が明確
  },

  JOURNAL: {
    TITLE: "足あと",
    SUBTITLE: "",
    LOADING: "読み込み中...",            // 詩的表現より「今何をしているか」を優先
    EMPTY_TITLE: "記録がありません",       // 「静けさ」を削り、事実を伝える
    EMPTY_DESC_1: "まだここには何の軌跡もありません。",
    EMPTY_DESC_2: "誰かに感謝を届けたり、Lmが動いたとき、",
    EMPTY_DESC_3: "ここに静かな記憶として刻まれます。",
    TODAY: "今日",
    YESTERDAY: "昨日",
    LOG_BIRTH: "アカウントの作成", 
    LOG_REBIRTH: "Lmの巡り（リセット）",  // カッコ書きで機能を補足
    LOG_GIFT_SENT: "Lmを贈りました",
    LOG_GIFT_RECV: "Lmを受け取りました",
    LOG_WISH_CANCEL_TITLE: "願い「%s」の取り下げ",
    LOG_WISH_CANCEL: "願いの取り下げ",
    LOG_WISH_EXPIRE_TITLE: "願い「%s」の期限切れ", // 「風に溶けた」を「期限切れ」に戻し、一目で把握させる
    LOG_WISH_EXPIRE: "願いの期限切れ",
    LOG_COMP_SENDER_WITHDRAW: "中断に伴うお礼の贈与", // 「去りゆく人」を「中断に伴う」へ。因果関係を明確に
    LOG_COMP_SENDER_NORMAL: "中断に伴うお礼の贈与",
    LOG_COMP_RECV_WITHDRAW: "相手の中断に伴うお礼の受領",
    LOG_COMP_RECV_NORMAL: "相手の中断に伴うお礼の受領",
    LOG_WISH_SENDER: "願いの完了に伴う贈与",    // 因果関係（完了したから贈った）を明示
    LOG_WISH_RECV: "願いの完了に伴う受領",      // 同上
    KW_WITHDRAWAL: "退会（繋がりを解く）",    // 機能をカッコで残す
    KW_COMPENSATION_SENDER: "中断のお礼",
    KW_COMPENSATION_MAKER: "中断のお礼",
    KW_PRICELESS: "無償の願い",
    DESC_COMP_SENDER: "願いを取り下げたため、これまでのお礼としてLmを贈りました",
    DESC_COMP_RECV: "相手が願いを取り下げたため、お礼のLmを受け取りました",
    DESC_WISH_SENDER: "願いが叶い、感謝と共にLmを贈りました",
    DESC_WISH_RECV: "願いに寄り添い、感謝と共にLmを受け取りました",
    DESC_WISH_PARTIAL_SENDER: "手元のLmが足りず、あるだけのLmを贈りました",
    DESC_WISH_PARTIAL_RECV: "相手のLmが足りず、一部のLmを受け取りました",
    DESC_EXPIRED: "期限が経過したため、自動的に取り下げられました", // 「風に溶ける」を説明文へ
    DESC_PRICELESS: "無償の願いとして、記憶に留まりました",
    DESC_REBIRTH: "また新しく、灯火を授かりました",
    DESC_BIRTH: "この静寂な世界に足を踏み入れました", // Existing
    TAG_EXPIRED: "期限切れ", 
    TAG_RECORDED: "刻まれた",             // 「記録済」を排除
    
    // DB checks (保持しつつ表面の言葉を整える)
    KW_BIRTH_ORIGINAL: "Lm",
    KW_REBIRTH_ORIGINAL: "魂",
    KEYWORD_WITHDRAWAL: "旅立ち",         // 「退会」を排除
    KEYWORD_COMP_SENDER: "お礼の贈与",     // 「補償金送信」を排除
    KEYWORD_COMP_REQ: "お礼 of 発生",       // Avoid duplicate from earlier if any
    DB_DESC_PRICELESS: "無償の願い",       // 「無料取引」を排除
    DB_DESC_BIRTH: "誕生",               // 「アカウント作成」を排除
    DB_DESC_REBIRTH: "再生",
    KW_BIRTH: "system_birth",
    KW_REBIRTH: "system_rebirth",
  },

  // 4. 願い・ギフト関連 (Wish components)
  WISH: {
    TIER_HEAVY_LABEL: "[大いなる願い]",
    TIER_HEAVY_SUB: "時間を要する、大きな手助けや頼みごと",
    TIER_MEDIUM_LABEL: "[日常の願い]",
    TIER_MEDIUM_SUB: "日常のなかでの、ちょっとした手助け",
    TIER_LIGHT_LABEL: "[ささやかな願い]",
    TIER_LIGHT_SUB: "数分で終わる、簡単な頼みごとや共有",
    PLACEHOLDER_FALLBACK: "願いの詳細を入力してください",
    SHARE_SUCCESS: "願いを公開しました",
    SHARE_LM_LABEL: "贈るLm",
    SHARE_LM_UNIT: "(Lm)",
    GUIDE_LINK: "Lmを贈るガイドライン",
    GIFT_BADGE: "贈与",
    BALANCE_INFO_PREFIX: "現在、あなたが贈ることのできる最大Lmは ",
    BALANCE_INFO_SUFFIX: " Lm です",
    NO_BALANCE_WARN: "Lmが不足しています。新しい願いを公開するには、進行中の願いを一度取り下げてください。",
    TIER_ZERO_LABEL: "[無償の願い]",
    CONTENT_LABEL: "願いの詳細",
    ANONYMOUS_LABEL: "匿名モード",
    ANONYMOUS_NOTE: "※誰かが願いを引き受けるまで、あなたの名前は伏せられます",
    SUBMITTING: "送信中...",
    SUBMIT_BUTTON: "願いを公開する",
    APPLICANT_ANONYMOUS: "匿名ユーザー",
    APPLICANT_APPROVE: "この人に託す",
    CARD_TIME_MINUTES_AGO: "分前",
    CARD_TIME_HOURS_AGO: "時間前",
    EMPTY_DEFAULT: "まだ願いはありません",
    BTN_LOAD_MORE: "過去を読み込む",
  },

  // 4b. 願い・ギフト関連 (WishCard subcomponents)
  WISH_CARD: {
    // CardModals
    MODAL_HELPER_LIST: "手を差し伸べてくれた方々", // 「担当者候補リスト」を排除
    MODAL_NO_APPLICANTS: "まだ誰もいません",
    MODAL_SELECT_ONE: "託す方を1名選んでください",
    MODAL_CANCEL_WISH_Q: "この願いを取り下げますか？",
    MODAL_RESIGN_Q: "この願いから離れますか？", // 「辞退」という業務用語を排除
    MODAL_CANCEL_REQ_Q: "この願いを取り下げますか？",
    MODAL_COMPENSATE_WARN_1: "ここで願いを取り下げる場合、添えられていたLmは",
    MODAL_COMPENSATE_WARN_2: "これまで寄り添ってくれた「お礼」として、相手に贈られます。", // 「ペナルティ」という罰則の概念を排除
    MODAL_RESIGN_WARN: "これまでの繋がりは、静かに解かれます。", // 「ステータスはリセット」を排除
    MODAL_CANCEL_SAFE: "添えられていたLmは、あなたの手元に戻ります。",
    TOAST_CANCELLED: "取り下げました",
    BTN_COMPENSATE: "Lmを贈って、取り下げる", // 「ペナルティを支払う」を排除
    BTN_RESIGN: "離れる",
    BTN_CANCEL_REQ: "取り下げる",
    BTN_BACK: "戻る",
    MODAL_APPROVE_Q: "さんに願いを託しますか？", // 「承認する」を排除
    MODAL_MSG_HINT: "託す際、短い言葉を添えることができます（任意）。",
    MODAL_MSG_PLACEHOLDER: "伝えたいことがあれば入力してください",
    BTN_APPROVE: "この人に願いを託す",
    BTN_CANCEL: "キャンセル",
    ANONYMOUS_HELPER: "匿名ユーザー",
    TOAST_THANKED: "感謝を届けました", // 「決済処理完了」を排除
    TOAST_ERROR: "上手く届けられませんでした",

    // CardHeader
    HDR_MY_WISH: "[ わたしの願い ]", // 「マイタスク(作成)」を排除
    HDR_MY_HELP: "[ 寄り添う願い ]", // 「マイタスク(担当)」を排除
    HDR_OTHER_WISH: "[ 誰かの願い ]", // 「公開タスク」を排除
    HDR_DEFAULT_HELPER: "システム",
    HDR_SENDER_DONE: "感謝を届けました",
    HDR_INTERRUPTED: "願いが取り下げられました", // 「中断」を排除
    HDR_CANCELLED: "繋がりが解かれました",
    HDR_IN_PROGRESS: "誰かが寄り添っています", // 「ユーザーがタスクを担当中」を排除
    HDR_UNFULFILLED: "まだ誰もいません",
    HDR_TITLE_MY: "綴った願い",
    HDR_TITLE_HELP: " 願いに寄り添う",
    HDR_TITLE_OTHER: " さんの願い",
    HDR_REQ_COUNT: "届けた感謝: ", // 「完了数」を排除
    BTN_EDIT: "編集",
    BTN_WITHDRAW: "取り下げる",
    BTN_INTERRUPT: "取りやめる (お礼を贈る)", // 「中断(ペナルティ支払い)」を排除

    // CardFooter
    FTR_IN_PROGRESS: "進行中", // 実用性を考慮し維持
    FTR_COMP_RECV: "お礼を受領", // 「ペナルティ受取済」を排除
    FTR_COMP_SENT: "お礼を贈与", // 「ペナルティ支払済」を排除
    FTR_CANCELLED: "取り下げ済",
    FTR_WAIT_CONFIRM: "確認待ち", // 「承認待ち」を排除
    FTR_THANKED: "感謝を完了", // 「決済済」を排除
    FTR_EXPIRED_SETTLED: "静かに終了（期限切れ）",
    FTR_EXPIRED: "期限切れ",
    FTR_RECRUITING: "公開中", // 「募集中」という労働感を排除
    FTR_ANON: "匿名",
    FTR_APPLICANTS: "人が手を差し伸べています", // 「件の応募」を排除
    FTR_THANK_CONFIRM_1: "願いが叶ったことを確認し、Lmと",
    FTR_THANK_CONFIRM_2: "感謝の言葉を届けます。", // 「決済を実行」を排除
    FTR_THANK_ALERT: "感謝を届けますか？ Lmが手元から離れます。",

    // OptimisticWishPhantom
    PH_ERROR_TITLE: "通信が不安定です: 願いが届きませんでした",
    PH_ERROR_REASON: "理由: ",
    PH_TRASH: "この内容を消去する",
    PH_CAUTION: "※この願いに添えたLmは、すでに手元に戻っています", // 「予約解除」を排除
    PH_SENDING: "送信中...",

    // CardHeader
    TTL_THANKS_DELIVERED: "感謝を届けた回数:",
    LBL_MYSELF: "自分",

    // CardFooter
    BTN_GIVE_THANKS_DONE: "お礼をする (完了)",
    TXT_WAITING_REPLY: "返事を待っています",
    MSG_CONFIRM_CANCEL: "本当に寄り添うのを取りやめますか？", // 「立候補を取り消す」を排除
    MSG_CANCEL_SUCCESS: "取りやめました",
    BTN_CANCEL_APPLY: "取り消す",
    BTN_RESPOND: "応える",
    BTN_DECLINE: "見送る", // 「辞退」を排除
    BTN_CLEANUP_RECORD: "この記録を整理する",

    // CardContent
    BTN_UPDATE: "更新",
    LBL_RESONANCE: "無償の願い", // 「無償取引(Echo)」を排除
    LBL_DELIVERED_THANKS: "贈られたLm", // 「決済額(最終)」を排除
    LBL_END_BY_WITHDRAWAL: "アカウント削除により終了",
    RSN_HELPER_RESIGN_REQ: "相手が離れたため、添えられていたLmが戻りました", // 「予約残高が返却」を排除
    RSN_HELPER_RESIGN_HELP: "願いから離れました",
    RSN_COMP_REQ: "願いを取り下げたため、これまでのお礼としてLmを贈りました", // ペナルティの言い換え
    RSN_COMP_HELP: "相手が願いを取り下げたため、お礼のLmを受け取りました", // ペナルティの言い換え
    RSN_CANCELLED_REQ: "取り下げ完了",
    RSN_CANCELLED_HELP: "終了しました",
    RSN_NATURAL_EXPIRY: "期限切れによるシステムキャンセル",
    TAG_ECHO: "∞ 無償",
    LBL_RECV_DONE: "受取完了", // 「入金済」を排除
    LBL_SENT_DONE: "贈与完了", // 「送金済」を排除
    LBL_GIVE_THANKS: "贈るLm", // 「支払額」を排除
    LBL_SHARE_THANKS: "添えられたLm", // 「設定報酬額」を排除
    TXT_THANKS_DECAY_NOTE: "※時間経過と共に、静かに減少します",
    LBL_ECHO: "無償の願い", // 「無償処理」を排除

    // CardContact
    HDR_CONTACT_REQ: "相手の連絡先",
    HDR_CONTACT_HELP: "依頼主の連絡先",
    BTN_COPY: "アドレスをコピー",
    BTN_MAIL: "手紙を書く", // 「メールを作成する」から少し情緒的に
    TXT_NO_CONTACT: "連絡先は設定されていません",
    HDR_MEMO_REQ: "さんのメモ",
    HDR_MEMO_HELP: "依頼者さんより",
    // ApplicantItem
    LBL_MALE: "男性",
    LBL_FEMALE: "女性",
    BTN_CHOOSE: "この人に託す", // 「お願いする」を統一
    LBL_ANONYMOUS: "匿名",
  },

  // 5. プロフィール・設定関連 (ProfileView / ProfileEditScreen)
  PROFILE: {
    LANG_TITLE: "言語設定",
    LANG_HELP: "表示言語を切り替えます",
    TITLE: "ユーザー設定",
    SUBTITLE: "",
    EDIT_TITLE: "プロフィール編集",
    EDIT_SUBTITLE: "基本情報の更新",
    SAVE_BUTTON: "保存",
    SAVING: "保存中...", 
    PHOTO_CHANGE: "画像アップロード",
    PHOTO_OPTIMIZING: "処理中...",
    PHOTO_ERROR: "ファイル処理エラー。別の画像をお試しください。",
    SHIELD_TITLE: "本人確認ステータス",
    SHIELD_DESC: "すべての必須項目を入力することで、認証済みユーザーとしてマークされます。",
    REQ_AVATAR: "プロフィール画像の登録",
    REQ_BIO: "自己紹介の入力 (30文字以上)",
    REQ_SNS: "外部アカウント連携 (1つ以上)",
    BASIC_INFO: "基本情報",
    NAME_LABEL: "表示名",
    NAME_PLACEHOLDER: "名前を入力",
    AGE_LABEL: "年代",
    AGE_UNSELECTED: "未選択",
    GENDER_LABEL: "性別",
    GENDER_NOTE: "※「その他・回答しない」を選択した場合、外部には非表示となります。",
    BIO_LABEL: "自己紹介",
    BIO_PLACEHOLDER: "自己紹介文を入力してください (最大160文字)",

    AGE_OPTIONS: [
      "under_20",
      "20",
      "30",
      "40",
      "50",
      "60",
      "70",
      "over_80"
    ] as const,

    LBL_HELPED_COUNT: "手伝った回数",
    LBL_REQUEST_COUNT: "依頼実績",
    TXT_TIMES: "回",
    INF_DISCORD: "Discord連携",
    TXT_UNLINKED: "未連携",
    LOCATION_TITLE: "居住地・拠点",
    LOCATION_PREF_LABEL: "都道府県",
    LOCATION_CITY_LABEL: "市区町村",

    // ProfileView Additions
    MSG_FAREWELL: "すべての繋がりが解かれました。",
    ARIA_ADMIN: "管理コンソール",
    ARIA_EDIT: "プロフィール編集",
    TXT_LEFT_DAYS: "あと",
    TTL_ACTIVITY: "アクティビティ・実績",
    TXT_NOT_SET: "未設定",
    BTN_QUIT: "やめる",
    TTL_ACCOUNT_REG: "アカウント本登録",
    PH_EMAIL: "メールアドレス",
    PH_PASSWORD: "パスワード",
    TTL_PW_CHANGE: "パスワード変更",
    PH_NEW_PASSWORD: "新しいパスワード",
    PH_CONFIRM: "確認用",
    TXT_AREA_NOT_SET: "エリア未設定",
    TXT_CHECKING: "確認中...",
    TTL_AREA_INFO: "エリア情報",
    LOCATION_CITY_SELECT: "市区町村を選択",
    LOCATION_LOADING: "読み込み中...",
    SNS_TITLE: "ソーシャルリンク",
    ACCOUNT_TITLE: "アカウント",
    EMAIL_LABEL: "登録メールアドレス",
    EMAIL_NOTE: "プライバシー保護のため、マッチング成立時のお相手以外には公開されません",
    EMAIL_CHANGE_BTN: "メールアドレスを変更する",
    EMAIL_MODAL_TITLE: "メールアドレスの変更",
    PROMPT_BIO: "自己紹介を入力してください",
    AREA_TITLE: "居住地域",
    AREA_UNSET: "地域未設定",
    ACTIVITY_TITLE: "これまでの軌跡",
    ACT_HELPED: "叶えた願いの数",
    ACT_REQUESTED: "公開した願いの数",
    MENU_LINK_ACCOUNT: "アカウント本登録",
    MENU_CHANGE_PASS: "パスワード変更",
    MENU_LOGOUT: "ログアウト",
    MENU_DELETE: "この場所から離れる",
    LOGOUT_CONFIRM: "ログアウトしますか？",
    LOGOUT_GUEST_WARN: "お試し利用のため、ログアウトするとこれまでの軌跡が消えます。",
    DELETE_TITLE_1: "この場所から離れる",
    DELETE_DESC_1: "あなたの軌跡やLmはすべて消去されます。この操作は取り消せません。",
    DELETE_TITLE_2: "最終確認",
    DELETE_DESC_2: "本当にこの場所から離れるか？消えた軌跡は復元できません。",
    DELETE_SUCCESS: "すべての繋がりが解かれました。",
    AUTH_REQUIRE: "本人確認のためパスワードを入力してください。",
    BTN_CANCEL: "キャンセル",
    BTN_PROCEED: "次へ",
    BTN_LEAVE: "削除を実行",
    BTN_AUTH_LEAVE: "認証して削除",
    FALLBACK_NAME: "ゲストユーザー",
    LINK_SUCCESS: "アカウントの登録が完了しました",
    PW_MISMATCH: "パスワードが一致しません",
    PW_CHANGE_SUCCESS: "パスワードを変更しました",
    PW_REQUIRED: "パスワードの入力は必須です。",
    PW_INCORRECT: "パスワードが正しくありません。",
    ERROR_PREFIX: "エラー: ",
    TRUST_RECOVERY_1: "現在、中断による制限があります。",
    TRUST_RECOVERY_2: "あと %d 回願いを叶えることで、制限が解除されます。",
    PW_VERIFY: "パスワード認証",
    PW_INPUT: "パスワードを入力",
    PROC_LOADING: "処理中...",
    PW_NEW: "新しいパスワード",
    PW_CONFIRM: "パスワード (確認)",
    BTN_CLOSE: "閉じる",
    BTN_REGISTER: "登録",
    BTN_CHANGE: "変更",
    APP_VER: "System v0.2.0",
    EMAIL_REQ_BOTH: "メールアドレスとパスワードを入力してください",
    EMAIL_CHANGE_SUCCESS: "メールアドレスを変更しました",
    EMAIL_IN_USE: "このメールアドレスは既に使用されています",
    EMAIL_INVALID: "無効なメールアドレスです",
    EMAIL_CHANGE_FAIL: "メールアドレスの更新に失敗しました",
    SAVE_ERROR_PREFIX: "保存エラー: ",
    SNS_PLACEHOLDER_USER: "@ユーザーID または URL",
    SNS_PLACEHOLDER_WEB: "https://で始まるURL",
    EMAIL_NEW_LABEL: "新しいメールアドレス",
    EMAIL_PW_LABEL: "現在のパスワード",
    BTN_CHANGING: "更新中...",
    BTN_CHANGE_PW: "変更する"
  },

  // 6. 各種モーダル・ガイド (PresenceModal / GuideModal等)
  MODALS: {
    PRESENCE_TITLE: "人々の気配",
    PRESENCE_PLEASE_SELECT: "場所を選ぶ",
    PRESENCE_CHECKING: "耳を澄ましています...",
    PRESENCE_PREF_PLACEHOLDER: "都道府県",
    PRESENCE_CITY_PLACEHOLDER: "市区町村",
    PRESENCE_CITY_LOADING: "読み込み中...",
    PRESENCE_PRIVACY_NOTE: "※プライバシー保護のため、5名未満の場合は一律表記となります",
    
    GUIDE_TITLE: "贈与の道標",
    GUIDE_SUBTITLE: "添えるLmの目安",
    GUIDE_INTRO_1: "Lmは、感謝を形にして贈るためのものです。",
    GUIDE_INTRO_2: "願いの大きさに応じて、無理のないLmを添えてください。",
    GUIDE_HEAVY_TITLE: "[大いなる願い]",
    GUIDE_HEAVY_SUB: "時間を要する願い",
    GUIDE_HEAVY_DESC: "長時間の作業や専門的な知識を要する頼みごと。\n多めのLmを添えることをお勧めします。",
    GUIDE_MEDIUM_TITLE: "[日常の願い]",
    GUIDE_MEDIUM_SUB: "日常の頼みごと",
    GUIDE_MEDIUM_DESC: "日常的な作業や、数十分程度の時間を要する頼みごと。\n標準的なLmを添えることをお勧めします。",
    GUIDE_LIGHT_TITLE: "[ささやかな願い]",
    GUIDE_LIGHT_SUB: "簡易な願い / 無償",
    GUIDE_LIGHT_DESC: "数分で完了する簡単な頼みごとや、挨拶程度のやりとり。\nLmを添えない（無償の願い）ことも可能です。",
    GUIDE_HYBRID_TITLE: "お金との境界線",
    GUIDE_HYBRID_1: "物品の購入費や交通費などは、直接現金や外部の決済手段でやりとりしてください。",
    GUIDE_HYBRID_2: "Lmは、あくまで「感謝の気持ち」として贈られるべきものです。",
    BTN_CLOSE: "閉じる",
  },

  ACCOUNT_MODAL: {
    TITLE: "ユーザー設定",
    BTN_LOGOUT: "ログアウト",
    BTN_DELETE: "この場所から離れる",
    DELETE_WARNING: "すべての軌跡とLmは消え、元に戻すことはできません。本当によろしいですか？",
    PW_CONFIRM_TITLE: "パスワードを確認します",
    PW_PLACEHOLDER: "パスワードを入力",
    BTN_CANCEL: "キャンセル",
    BTN_DELETING: "繋がりを解いています...",
    BTN_AUTH_DELETE: "確認して離れる",
    BTN_EXEC_DELETE: "繋がりを解く",
    LOADING_TITLE: "この場所から離れる準備をしています",
    LOADING_DESC: "完了までしばらくお待ちください。\n画面を閉じず、そのままお待ちください。",
    ERR_REAUTH: "セキュリティ保護のため、パスワードの再入力が必要です。",
    ERR_WRONG_PW: "パスワードが間違っています。",
    ERR_FAIL: "処理に失敗しました。少し時間をおいてから、もう一度お試しください。"
  },
  
  CREATE_WISH: {
    PLACEHOLDER_FALLBACK: "願いの詳細を入力してください",
    PLACEHOLDER_PREFIX: "例：\n",
    TOAST_SUCCESS: "願いを公開しました",
    LBL_MIGHT: "贈るLm",
    LBL_UNIT: "(Lm)",
    LINK_GUIDE: "Lmを贈るガイドライン",
    TAG_GIFT: "贈与",
    LBL_AVAILABLE_1: "現在、あなたが贈ることのできる最大Lmは",
    LBL_AVAILABLE_2: "までです",
    WARN_EXCEED: "Lmが不足しています。新しい願いを公開するには、進行中の願いを一度取り下げてください。",
    TIER_0: "無償",
    LBL_CONTENT: "願いの詳細",
    CHK_ANONYMOUS: "匿名で作成する",
    NOTE_ANONYMOUS: "※誰かが願いを引き受けるまで、あなたの名前は伏せられます",
    BTN_SENDING: "送信中...",
    BTN_SUBMIT: "願いを公開する",
    BTN_CANCEL: "キャンセル",
    TIER_HEAVY_LABEL: "[大いなる願い]",
    TIER_HEAVY_SUB: "時間を要する、大きな手助けや頼みごと",
    TIER_MEDIUM_LABEL: "[日常の願い]",
    TIER_MEDIUM_SUB: "日常のなかでの、ちょっとした手助け",
    TIER_LIGHT_LABEL: "[ささやかな願い]",
    TIER_LIGHT_SUB: "数分で終わる、簡単な頼みごとや共有",
  },
  
  TICKER: {
    TITLE: "鼓動",
    DESC: "生存の証を刻み、新たな「Lm」を生み出します",
    BTN_SEND: "鼓動を刻む",
    STATUS_SUCCESS: "刻みました",
    STATUS_COOLDOWN: "静寂",
    PHASE: "フェーズ",
    PHASE_FULL: "満月",
    PHASE_HALF: "下弦",
    PHASE_NEW: "新月",
    REIGNITE: "✦ 満月の再点火 ✦",
  },
  
  COMPLETE_WISH: {
    TITLE: "願いの完了",
    GREETING: "さんに感謝を届けます",
    REQ_LABEL: "託した願い",
    THANKS_LABEL: "感謝の言葉",
    TIER_LIGHT: "ささやかな願い",
    TIER_MEDIUM: "日常の願い",
    TIER_HEAVY: "大いなる願い",
    BTN_CONFIRM: "感謝を届けて完了する",
    BTN_CANCEL: "キャンセル"
  },


  // 7. 通知関連 (NoticePanel等)
  NOTICE: {
    TITLE: "通知",
    EMPTY_TITLE: "通知はありません",
    EMPTY_DESC: "新着情報がある場合、ここに表示されます",
    TIME_JUST_NOW: "たった今",
    TIME_MINUTES_AGO: "分前",
    TIME_HOURS_AGO: "時間前",

    TOOLTIP_DISMISS_ALL: "すべて既読にする",
    TOOLTIP_DISMISS: "閉じる",
  },

  // 8. ナビゲーション・レイアウト (Header, Footer, SideDrawer)
  LAYOUT: {
    TAB_HOME: "ホーム",
    TAB_HISTORY: "軌跡",            // 「履歴」という無機質な言葉を排除
    TAB_PROFILE: "ユーザー設定",          // 「アカウント」というシステム用語を排除
    RETURN_HOME: "ホームへ戻る",
    OPEN_MENU: "メニューを開く",
    SIDEDRAWER_ONBOARDING: "この場所について", // 「システム概要」を排除
    SIDEDRAWER_INSTALL: "ホーム画面に置く",
    SIDEDRAWER_TRUST: "約束ごと",    // 「利用規約」を排除
    SIDEDRAWER_FOOTER_NOTE: "設定と管理",
    HEADER_BALANCE: "Lm：",        // 「残高」を排除
    HEADER_DAYS_LEFT_PREFIX: "(満ちるまで ", // 「残り〇日」という焦燥感を排除
    HEADER_DAYS_LEFT_SUFFIX: "日)",
  },

  // 9. PWAインストール関連 (PWAInstallBanner等)
  PWA: {
    BANNER_DESC: "ホーム画面にアプリを追加することで、ブラウザのUIを非表示にし、ネイティブアプリのように利用できます。",
    BTN_INSTALL: "インストール",
    BTN_LATER: "後で",
    BTN_CLOSE: "閉じる",
    BTN_CHECKED: "確認しました",
    IOS_STEP_1: "ブラウザ下部の「共有」アイコンをタップ",
    IOS_STEP_2: "「ホーム画面に追加」を選択",
    IOS_COMPLETED_NOTE: "追加後、ホーム画面のアイコンから起動してください。",
    IOS_INSTRUCTIONS_TITLE: "インストール手順 (iOS)",
    IOS_INSTRUCTIONS_STEP1: "Safari下部（iPadは上部）の共有アイコンをタップします。",
    IOS_INSTRUCTIONS_STEP2: "メニューから「ホーム画面に追加」を選択します。",
    IOS_INSTRUCTIONS_STEP3: "画面右上の「追加」をタップします。",
    INSTALL_SUCCESS: "インストールが完了しました",
  },

  // 10. オンボーディング (OnboardingStory)
  ONBOARDING: {
    ONBOARDING_FINISH: "はじめる",
    ONBOARDING_SKIP: "スキップ",

    SLIDE1_TITLE: "Lmについて",
    SLIDE1_P1: "あなたには、",
    SLIDE1_P2: "月の満ち欠けのようなサイクルで",
    SLIDE1_P3: "一定の",
    SLIDE1_P4: "Lmが満ちていきます。",
    SLIDE1_P5: "これが、誰かに感謝を贈るための光です。",

    SLIDE2_TITLE: "静かな減価",
    SLIDE2_P1: "手元にあるLmは、",
    SLIDE2_P2: "時間経過に伴い",
    SLIDE2_P3: "静かに、そして自動的に",
    SLIDE2_P4: "減っていきます。",
    SLIDE2_P5: "溜め込み続けることはできません。",
    SLIDE2_P6: "誰かのために、風に乗せて放ってください。",

    SLIDE3_TITLE: "願いと贈与",
    SLIDE3_P1: "手元のLmを添えて、",
    SLIDE3_P2: "世界に願いを公開することができます。",
    SLIDE3_LBL_REQ: "願いを放つ",
    SLIDE3_LBL_RES: "願いに寄り添う",
    SLIDE3_P3: "願いが叶い、感謝と共にLmを贈ると、",
    SLIDE3_P4: "そのLmは減ることのない「軌跡」として残ります。",

    SLIDE4_TITLE: "添えるLmの目安",
    SLIDE4_TIER1_TITLE: "[大いなる願い]",
    SLIDE4_TIER1_DESC: "時間を要する、大きな手助けや頼みごと",
    SLIDE4_TIER2_TITLE: "[日常の願い]",
    SLIDE4_TIER2_DESC: "日常のなかでの、ちょっとした手助け",
    SLIDE4_TIER3_TITLE: "[ささやかな願い]",
    SLIDE4_TIER3_DESC: "数分で終わる簡単な頼みごとや、無償のやりとり",

    SLIDE5_TITLE: "お金との境界線",
    SLIDE5_P1_1: "物品の購入費や交通費などの「現実の費用」は",
    SLIDE5_P1_2: "直接、当事者間でやりとりしてください。",
    SLIDE5_P2_1: "ここで贈られるLmは",
    SLIDE5_P2_2: "あくまで感謝の気持ちを表すものです。",
    SLIDE5_P3_1: "現実のお金と、感謝のLmを",
    SLIDE5_P3_2: "明確に分けてお使いください。",
    SLIDE5_P4_1: "この約束をご理解いただいた上で",
    SLIDE5_P4_2: "静かな時間をお過ごしください。",

    BTN_BACK: "戻る",
    BTN_NEXT: "次へ",
    BTN_CLOSE: "閉じる",
  },
  // 11. 儀式・演出 (RitualOverlay)
  RITUAL: {
    BREATHING: "処理中...",
    BLOOMING: "完了",
    SYNCING: "同期中",
    SUBTEXT: "私は私である / Existence Tickerの世界へ",
  },

  // 12. 利用規約と運営に関する表記 (TrustPage)
  TRUST: {
    NAV_CLOSE: "閉じる",
    NAV_TITLE: "システム概要",
    HEADER_SUB: "Terms of Service",
    HEADER_TITLE: "利用規約と運営について",
    
    SEC1_SUB: "I. Administrator",
    SEC1_TITLE: "システム管理者について",
    SEC1_P1_1: "当システムは、現在",
    SEC1_P1_2: "玉置士朗 / 合同会社カイシュウ",
    SEC1_P1_3: "によってサーバー運用およびシステム保守が行われています。",
    SEC1_P2: "システムに関するお問い合わせは、下記メールアドレスまでご連絡ください。",
    
    SEC2_SUB: "II. Purpose of Use",
    SEC2_TITLE: "利用目的の制限",
    SEC2_P1: "本システムはユーザー間の相互支援を目的として設計されています。\nスパム行為、営利目的の宣伝、その他システムに負荷をかける\n不正利用は固く禁じております。",
    SEC2_P2: "また、現在はアルファ版（開発・実験段階）として稼働しているため、\nシステムのアップデートや仕様変更に伴い、登録データが\n初期化される可能性があります。あらかじめご了承ください。",
    
    SEC3_SUB: "III. Privacy Policy",
    SEC3_TITLE: "プライバシーとデータ保護",
    SEC3_P1: "ご登録いただいたメールアドレスや、\nシステム内で作成されたタスクデータ等のユーザー情報を、\n第三者企業へ販売・譲渡することは一切ありません。",
    SEC3_P2: "ユーザーデータは本システム内でのみ厳密に管理されます。\n入力された情報はユーザー自身に帰属します。",
    
    FOOTER_SUB: "System Infrastructure",
    FOOTER_BTN: "閉じる",
    FOOTER_COPY: "© 2026 System Administrator.",
  },

  // 13. 自律分散型互助生態系構想書 (ProtocolManual)
  PROTOCOL: {
    HEADER_SUB: "Existence Ticker プロトコル v2.0",
    HEADER_TITLE: "自律分散型互助生態系構想書",
    INTRO_1: "本ドキュメントは、本システムの投資家および設計協力者に向けたアーキテクチャ解説書です。",
    INTRO_2: "我々は「富の保存」ではなく「感謝の循環」を価値の源泉とする、新たな経済物理学を実装しました。",
    
    CH1_NUM: "01",
    CH1_TITLE: "理念",
    CH1_SUB: "\"蓄積\" から \"循環\" へ",
    CH1_P1_1: "現代社会の閉塞感は「感謝の滞留」にあります。エネルギー（貨幣）が循環の媒体としての機能を失い、個人の所有物（蓄積）としてダムのように堰き止められた時、生態系は枯れ果てます。",
    CH1_P1_2: "我々はこの問題を解決するために、通貨を",
    CH1_P1_STRONG: "「保存する資産（蓄積）」から「感謝を伝えるエネルギー（循環）」へと再定義",
    CH1_P1_3: "しました。",
    CH1_P2_1: "この世界では、溜め込むことは重力による",
    CH1_P2_STRONG: "「深化（Deepening）」",
    CH1_P2_2: "を意味し、他者へ循環させることこそが生存戦略となります。",
    CH1_P2_3: "住人は「富を得るため」ではなく、「誰かを助け、誰かに助けられるため」にこのエネルギーを使用します。",
    
    CH2_NUM: "02",
    CH2_TITLE: "構造",
    CH2_SEC1_TITLE: "▼ 深化",
    CH2_SEC1_DESC: "自然界の法則と同様に、全てのエネルギーは時間とともに器の底へと「深化」します。この物理現象により、既得権益の固定化（格差の固定）を自然法則として阻止し、常に新たな代謝を促します。これは「損失」ではなく、エネルギーがより純粋な形へと相転移する過程です。",
    CH2_SEC2_TITLE: "▲ 太陽",
    CH2_SEC2_DESC_1: "「深化」によって底へと還ったエネルギーは、システム全体への「生命贈与（Basic Supply）」として蒸散・還元されます。これは行政による「給付」でも、再分配でもありません。あなたがここに",
    CH2_SEC2_STRONG: "「存在している」という事実そのものを担保にして",
    CH2_SEC2_DESC_2: "、天から降り注ぐ光のギフトです。",
    
    CH3_NUM: "03",
    CH3_TITLE: "統治",
    CH3_SUB: "支配ではなく、調律",
    CH3_P1_1: "管理者の役割は、住人の個別のやり取りを監視することではありません。",
    CH3_P1_G: "世界の「温度（代謝率）」と「湿度（エネルギー分布）」を観測し、",
    CH3_P1_STRONG: "「再生サイクル期間（Regeneration Cycle Duration）」というたった一つの物理定数（時間軸）を調整すること",
    CH3_P1_2: "だけが許された権限です。",
    CH3_OATH_TITLE: "管理者の誓い",
    CH3_OATH_1: "> 我々は経済を管理しない",
    CH3_OATH_2: "> 我々は生態系を設計する",
    CH3_OATH_3: "> ",
    CH3_OATH_4: "> 目的は「資産総額（蓄積）」ではなく「循環率（代謝）」の最大化である。",
    CH3_OATH_5: "> 豊かな世界とは、全員が富豪である世界ではなく、常に助けが得られる世界のことである。",
    
    CH4_NUM: "04",
    CH4_TITLE: "運用規約",
    CH4_1_TITLE: "4.1 構造的制約",
    CH4_1_SEC1_TITLE: "ℹ エネルギー還流",
    CH4_1_SEC1_P1_1: "本システムでは「あるがままの計算（Simple Physics）」を採用しています。個々の「願い（Committed Lm）」も時間とともに「深化」し、その価値を減じていきます。この際、持ち主の Available Lm が微増する現象が発生しますが、これは",
    CH4_1_SEC1_STRONG: "「深化によって願いがより純粋な形になり、余剰エネルギーが器に還流した」",
    CH4_1_SEC1_P1_2: "ものとして定義されます。この自然な還流を、我々は生態系の健全な呼吸として仕様認定しています。",
    
    CH4_1_SEC2_TITLE: "V 物理定数",
    CH4_1_SEC2_P1_1: "一人の人間が保持できるエネルギーの限界点は ",
    CH4_1_SEC2_STRONG: "2400 Lm",
    CH4_1_SEC2_P1_2: " です。この器（Vessel）を超えたエネルギーは「溢出（Overflow）」となり、巡り巡って「太陽」の燃料として再利用されるエコシステム・ループを形成します。",
    
    CH4_1_SEC3_TITLE: "⚠ 法の不遡及",
    CH4_1_SEC3_P1_1: "「再生サイクルの期間」の変更は、即座に全ユーザーに適用されるわけではありません。",
    CH4_1_SEC3_P1_2: "各ユーザーは個別に決定された「リセット日」を持っており、新しい時間設定は",
    CH4_1_SEC3_STRONG: "個々の次回リセット計算時",
    CH4_1_SEC3_P1_3: "に初めて適用されます。",
    CH4_1_SEC3_P1_4: "したがって、調律（Tuning）の効果が生態系全体に行き渡るまでには、現行サイクルの解消待ち（Latency）が発生します。",

    CH4_2_TITLE: "4.2 生体バイタル",
    CH4_2_A_TITLE: "A. 経済代謝率",
    CH4_2_A_CALC_LBL: "計算式",
    CH4_2_A_CALC_VAL: "一日あたりの取引量 ÷ 総供給量 × 100 (%)",
    CH4_2_A_TARGET_LBL: "目標領域",
    CH4_2_A_TARGET_VAL: "> 10.0% (理想)",
    CH4_2_A_DESC_1: "総滞留量（GDP）の多寡は重要ではありません。「血液の流速」こそが生命の証です。",
    CH4_2_A_DESC_2: "5%を下回る状態は「心停止」と同義であり、緊急の介入（Divine Intervention）を要します。",
    
    CH4_2_B_TITLE: "B. 資産分布深度",
    CH4_2_B_L1_STRONG: "飽和状態 (>1500 Lm):",
    CH4_2_B_L1_DESC: "この層が30%を超えると「飽和（Saturation）」です。エネルギー価値が希釈され、誰も働かなくなります。",
    CH4_2_B_L2_STRONG: "飢餓状態 (<500 Lm):",
    CH4_2_B_L2_DESC: "この層が50%を超えると「飢餓（Starvation）」です。生存不安により、他者への貢献（循環）が停止します。",
    
    CH4_3_TITLE: "4.3 サイクルと季節性",
    CH4_3_C_TITLE: "C. 世界の季節",
    CH4_3_C_SPRING: "春 (5-9日)",
    CH4_3_C_SPRING_DESC: "豊穣・加速",
    CH4_3_C_EQUINOX: "分点 (10日)",
    CH4_3_C_EQUINOX_DESC: "調和・標準",
    CH4_3_C_WINTER: "冬 (11-20日)",
    CH4_3_C_WINTER_DESC: "試練・選別",
    CH4_3_C_DESC_1: "調律者は「1サイクルの長さ」を伸縮させることで季節を操ります。",
    CH4_3_C_DESC_SPRING: "春（豊穣期）",
    CH4_3_C_DESC_2: "では頻繁に給付が行われ、世界は潤いますが、インフレ（飽和）のリスクがあります。",
    CH4_3_C_DESC_WINTER: "冬（厳冬期）",
    CH4_3_C_DESC_3: "では次の給付までの期間が長く、備蓄が枯渇しやすくなります。これにより生存本能が刺激され、停滞した富の強制循環（贈与）が促されます。",
    
    CH4_3_D_TITLE: "D. 日次代謝率",
    CH4_3_D_L1_STRONG: "Ideal: 10%",
    CH4_3_D_L1_DESC: "(10日間で1巡するため、毎日10%が入れ替わるのが平衡状態)",
    CH4_3_D_L2: "この値が大きく偏ると、将来的に特定の日だけ「リセット祭り」が発生するボラティリティのリスクとなります。",
    
    CH4_4_TITLE: "4.4 介入の書",
    CH4_4_TBL_H1: "状況",
    CH4_4_TBL_H2: "根本原因",
    CH4_4_TBL_H3: "処方箋",
    CH4_4_CAUSE_LBL: "根本原因",
    CH4_4_ACTION_LBL: "処方箋",
    
    CH4_4_R1_TITLE: "正常",
    CH4_4_R1_COND: "循環率 > 10% + 均衡状態",
    CH4_4_R1_CAUSE: "理想的な循環状態",
    CH4_4_R1_ACTION: "措置: 維持",
    CH4_4_R1_DESC: "介入不要。この均衡を見守ることが神の仕事です。",
    
    CH4_4_R2_TITLE: "飢餓",
    CH4_4_R2_COND: "低代謝 + 低残高",
    CH4_4_R2_CAUSE: "流動性枯渇による信頼崩壊",
    CH4_4_R2_ACTION: "措置: 春化",
    CH4_4_R2_DESC_1: "サイクルを短縮 (例えば5日へ) し、給付頻度を倍増させる。",
    CH4_4_R2_DESC_2: "恐怖を取り除くことが最優先。",

    CH4_4_R3_TITLE: "飽和",
    CH4_4_R3_COND: "低代謝 + 高残高",
    CH4_4_R3_CAUSE: "欲求(Wish)不足による停滞",
    CH4_4_R3_ACTION: "措置: 冬化",
    CH4_4_R3_DESC_1: "サイクルを延長 (例えば20日へ)。",
    CH4_4_R3_DESC_2: "「使わなければ尽きる」環境を作る。",

    CH4_4_R4_TITLE: "停滞",
    CH4_4_R4_COND: "循環率 < 5% (危機的)",
    CH4_4_R4_CAUSE: "文化の欠如 / 初期段階",
    CH4_4_R4_ACTION: "措置: 緊急介入",
    CH4_4_R4_DESC_1: "管理者自身による直接取引。",
    CH4_4_R4_DESC_2: "管理者が動いて手本を示す。",
    
    FOOTER_P1: "所有権および機密情報",
    FOOTER_P2: "互助経済圏のために設計"
  },

  // DATA Section
  DATA: {
    PREFECTURES: [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
      "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
      "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
      "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
      "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
      "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ] as const,
    RANKS: {
      VETERAN: "熟練",
      REGULAR: "馴染み",
      BEGINNER: "新顔",
    },
    WALLET: {
      DEFAULT_SENDER_NAME: "奏者",
      FIRST_REBIRTH_DESC: "源気が流れ込んできました",
      SUBSEQUENT_REBIRTH_DESC: "魂が再生されました",
    },
  },

  // 0. ランディングページ (Landing Page)
  LP: {
    NAV: {
      TITLE: "Existence Ticker",
      INVITE_LINK: "招待コードをお持ちの方",
      INVITE_LINK_SHORT: "招待コード",
    },
    HERO: {
      P1: "減ることは、失うことではありません。それは、深呼吸（代謝）です。",
      P2: "ずっと貯め込まなければならないなんて、苦しいはずです。",
      P3: "水が流れるように、息を吐いて吸うように。",
      P4: "本当の価値とは、留まることのない「循環」の中に宿ります。",
      P5: "私たちが作ったのは、時間と共に静かに消えていく価値：",
      GENKI_LABEL: "源気(Lm)",
      P6: "です。",
      P7: "でも、怖がらないでください。",
      P8: "それは「失うこと」ではなく、あなたが「生きていること」の証明です。",
      P9: "未来への不安（借金）を解き放ち、",
      P10: "今ここにある生命の拍動（存在）を、贈り合いませんか。",
      P11: "そんな、やさしい経済の形を始めませんか。",
    },
    SCENES: {
      S1000: "人生の節目を、誰かの手と共に。最大の敬意を込めて (1,000 Lm)。",
      S500: "ひとりでは辿り着けなかった場所へ。日常の感謝を込めて (500 Lm)。",
      S0: "ただ、一緒にいること。存在を祝い、共鳴すること (0 Lm / ∞)。",
    },
    MANIFESTO: {
      SECTION_TITLE: "Pilage's Progress",
      TITLE: "重機と万年筆",
      SUBTITLE: "重機と万年筆",
      QUESTION: "私たちは、なぜこのインフラを作ったのか？",
      TEASER: "重機（資本主義）の唸りが止まない真夜中に、\n一本のペンを握った開発者の記録。",
      BTN_PENDING: "現在、校正中\n(Coming Soon)",
      DECLARATION_TITLE: "Existence Ticker",
      DECLARATION_SUBTITLE: "——新時代の価値循環に関する宣言文",
      P1: "現代社会は、資本主義という名の巨大な「重機」に頼りすぎています。この機械は「未来からの借金」を燃料にし、「無知と競争」をスパークプラグにして、爆発的な発展をもたらしました。しかし、大地を穿つには適していても、一人の人間の心に安らぎを綴るには、重機はあまりに無骨すぎました。蓄積こそが価値であるという信仰は、やがて富を滞留させ、全人類に「失うことへの終わりのない恐怖」を植え付けました。",
      P2: "本来、価値とは生命と同じように循環するべきものです。流れの止まった川が淀むように、貯め込まれた富は腐ります。私たちに必要なのは、価値が腐らないための「減価（Decay）」の導入でした。時間と共に消えていくという健全な焦燥感が、滞留した世界を流動化させ、他者への譲渡を促します。減ることは損失ではなく、生きるための代謝です。",
      P3: "さらに、価値の源泉を「外」から「内」へと取り戻さなければなりません。既存のシステムが「借金」から始まるのに対し、私たちは「存在」から価値を定義します。生きているという物理現象、その拍動（Ticker）そのものがマイニングの証明です。あなたは誰かに養われているのではありません。ただ呼吸を続けるだけで、あなた自身が価値の源泉 = 中央銀行になるのです。この「存在の価値」への確信こそが、未来への生存本能的な恐怖を解除するための唯一のプロトコルです。",
      P4: "私たちは資本主義を否定しません。未開の地を切り拓くには、重機の馬鹿力が必要です。しかし、質を重んじ、生命の手触りを感じる瞬間には、そのエンジンを止め、万年筆を握る知恵を持つべきです。借金に追われて走るスリル＆サスペンスの時代から、存在を肯定し合うヒューマンドラマの時代へ。二つの道具を使い分け、信頼と安らぎと共に呼吸する時間を取り戻す。それが私たちの描く「真の豊かさ」の設計図です。",
    },
    RECRUIT: {
      TITLE: "Phase 2 (創世記)：30名の「守人」を募集します",
      P1: "Existence Tickerは、単なるアプリの配布ではありません。",
      P2: "私たちは今、資本主義の轟音を離れ、この「物語」を現実にする30名の守人を探しています。",
      P3: "一度に30人を集めることを急ぎません。\nたとえ一人ずつであっても、この哲学を共に磨き、「存在が価値になる」瞬間を共創できる同志と、静かに、深く、始めたいと考えています。",
      FILTER_LABEL: "魂のフィルター",
      CONDITION_TITLE: "【応募条件】",
      C1: "資本主義の計算（損得）を、一時的に手放せること。",
      C2: "あなたの「孤独」と「優しさ」を、このプロジェクトに貸してくれること。",
      C3: "グッドデザイン賞等の挑戦を通じ、新しい時代の証人となる覚悟があること。",
      BTN_SUBMIT: "ご縁を結ぶ",
      BTN_APPLY: "招待コードを入力して参加する",
      BTN_LOGGED_IN: "システムへ戻る",
    },
    ENTRANCE: {
      USER: "扉を開け、中へ",
      INVITE: "招待を受け、扉を開ける",
      GUEST: "扉を開く",
    },
    FOOTER: {
      COPYRIGHT: "© 2026 EXISTENCE TICKER.",
      AUTHOR: "庭師（開発・運営）：玉置士朗 / 合同会社カイシュウ",
      URL: "URL：",
      CONTACT: "お問い合わせ：trueeye792@gmail.com",
    },
    TOAST: {
      COPIED: "招待状をコピーしました",
      ERROR: "招待コードの検証に失敗しました",
      PREPARING: "現在準備中です",
    }
  }
} as const;

export type AppMessages = typeof MESSAGES;
