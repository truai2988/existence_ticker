export const MESSAGES = {
  // 0. 共通（画面横断）
  COMMON: {
    TAP_SCREEN: "画面をタップして始める",
  },

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
    NOTICE_WISH_APPROVED: "あなたの願いが聞き届けられました。", // 承認された（助け手側）
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
    BTN_RESPOND: "つながり",
    BTN_REQUEST: "願い",
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
    NOTICE_APPROVED: "%nameさんが、あなたにお願いを託しました。",
    NOTICE_FULFILLED: "%nameさんから、温かい「ありがとう」が届いています。",
    NOTICE_HELPER_RESIGNED: "%nameさんの都合により、お願いが未定に戻りました。次の方を待ちましょう。",
    NOTICE_REQUESTER_CANCEL: "依頼主の都合でお願いが中止になりました。これまで寄り添ってくれたことへの、感謝のしるしが届いています。",
    NOTICE_WISH_CANCELLED_WITH_APPLICANTS: "%nameさんの都合でお願いが中止になりました。これまで寄り添ってくれたことへの、感謝のメッセージが届いています。",
    NOTICE_HELPER_WAIT_RETURN: "%nameさんの都合により、お願いが未定に戻りました。次の方を待ちましょう。",
    NOTICE_APPLICATION: "%nameさんが「私がやります」と手を挙げてくれました。",
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
    TIER_LIGHT_LABEL: "[無償の願い]",
    TIER_LIGHT_SUB: "数字では測れない、プライスレスな想いや温もりの交換",
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
    ANONYMOUS_NOTE: "※願いを引き受けてもらった方だけに、あなたの名前が表示されます",
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
    STATUS_OPEN: "オープン",
    STATUS_PENDING: "承諾待ち",
    STATUS_ACTIVE: "進行中",
    // CardModals
    MODAL_HELPER_LIST: "立候補者", 
    MODAL_NO_APPLICANTS: "まだ誰もいません",
    MODAL_SELECT_ONE: "託す方を1名選んでください",
    MODAL_CANCEL_WISH_Q: "この願いを取り下げますか？",
    MODAL_RESIGN_Q: "この願いとの約定を白紙に戻しますか？", // 「辞退」という業務用語を排除
    MODAL_CANCEL_REQ_Q: "この願いを取り下げますか？",
    MODAL_COMPENSATE_WARN_1: "ここで願いを取り下げる場合、添えられていたLmは",
    MODAL_COMPENSATE_WARN_2: "これまで寄り添ってくれた「お礼」として、相手に贈られます。", // 「ペナルティ」という罰則の概念を排除
    MODAL_RESIGN_WARN: "これまでの繋がりは、解かれます。", // 「ステータスはリセット」を排除
    MODAL_CANCEL_SAFE: "添えられていたLmは、あなたの手元に戻ります。",
    TOAST_CANCELLED: "取り下げました。記録は『足あと』画面から確認できます",
    BTN_COMPENSATE: "Lmを贈って、取り下げる", // 「ペナルティを支払う」を排除
    BTN_RESIGN: "白紙に戻す",
    BTN_CANCEL_REQ: "取り下げる",
    BTN_BACK: "戻る",
    MODAL_APPROVE_Q: "さんに願いを託しますか？", // 「承認する」を排除
    MODAL_MSG_HINT: "託す際、短い言葉を添えることができます（任意）。",
    MODAL_MSG_PLACEHOLDER: "伝えたいことがあれば入力してください",
    BTN_APPROVE: "この人に願いを託す",
    BTN_CANCEL: "キャンセル",
    ANONYMOUS_HELPER: "匿名ユーザー",
    TOAST_THANKED: "感謝を届けました。『足あと』画面から記憶を振り返れます", // 次の導線案内を追加
    TOAST_ERROR: "上手く届けられませんでした",

    // CardHeader
    HDR_MY_WISH: "わたしの願い", // 「マイタスク(作成)」を排除
    HDR_MY_HELP: "寄り添う願い", // 「マイタスク(担当)」を排除
    HDR_OTHER_WISH: "誰かの願い", // 「公開タスク」を排除
    HDR_DEFAULT_HELPER: "システム",
    HDR_SENDER_DONE: "感謝を届けました",
    HDR_INTERRUPTED: "願いが取り下げられました", // 「中断」を排除
    HDR_CANCELLED: "繋がりが解かれました",
    HDR_IN_PROGRESS: "さんが寄り添っています", // 「ユーザーがタスクを担当中」を排除
    HDR_UNFULFILLED: "まだ誰もいません",
    HDR_TITLE_MY: "綴った願い",
    HDR_TITLE_HELP: " 願いに寄り添う",
    HDR_TITLE_OTHER: " さんの願い",
    HDR_REQ_COUNT: "届けた感謝: ", // 「完了数」を排除
    BTN_EDIT: "手直し",
    BTN_WITHDRAW: "取り下げる",
    BTN_INTERRUPT: "中止する (お礼を贈る)", // 「中断(ペナルティ支払い)」を排除

    // CardFooter
    FTR_IN_PROGRESS: "進行中", // 実用性を考慮し維持
    FTR_COMP_RECV: "お礼を受領", // 「ペナルティ受取済」を排除
    FTR_COMP_SENT: "お礼を贈与", // 「ペナルティ支払済」を排除
    FTR_CANCELLED: "取り下げ済",
    FTR_WAIT_CONFIRM: "確認待ち", // 「承認待ち」を排除
    FTR_THANKED: "感謝を完了", // 「決済済」を排除
    FTR_EXPIRED_SETTLED: "終了（期限切れ）",
    FTR_EXPIRED: "期限切れ",
    FTR_RECRUITING: "公開中", // 「募集中」という労働感を排除
    FTR_ANON: "匿名",
    FTR_APPLICANTS: "名の立候補",
    BTN_RESPONDENTS: "応えてくれた方", // プレッシャーを排除した表現
    FTR_THANK_CONFIRM: "願いが叶ったら、完了ボタンを押して下さい", // 「決済を実行」を排除
    FTR_THANK_ALERT: "Lmを添えて感謝を送ります",
    FTR_THANK_ALERT_LIGHT: "完了して感謝を伝えますか？（無償のためLmは消費されません）",

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
    BTN_GIVE_THANKS_DONE: "完了しました",
    TXT_WAITING_REPLY: "お返事待ち",
    TXT_WAITING_CANDIDATE: "お声待ち",
    MSG_CONFIRM_CANCEL: "本当に寄り添うのを取りやめますか？",
    MSG_CANCEL_SUCCESS: "そっと手を引きました。『足あと』画面から記録を確認できます",
    BTN_CANCEL_APPLY: "取り消す",
    BTN_RESPOND: "応える",
    BTN_DECLINE: "白紙に戻す", // 寄り添いからの離脱を表現
    BTN_CLEANUP_RECORD: "しまう",

    // Apply confirm modal（confirm()の代替カスタムUI）
    MODAL_APPLY_Q: "この依頼に立候補しますか？",
    MODAL_APPLY_ANON_Q: "これは「匿名の願い」です",
    MODAL_APPLY_ANON_DESC: "相手が誰かは約定するまでわかりませんが、あなたのお名前は相手に伝わります。",
    BTN_APPLY_CONFIRM: "手を挙げる",

    // Cleanup confirm modal（confirm()の代替カスタムUI）
    MODAL_CLEANUP_Q: "この記録を「足あと」へ移しますか？",
    MODAL_CLEANUP_DESC: "記録は整理され、「足あと」画面からいつでも振り返ることができます。",
    BTN_CLEANUP_CONFIRM: "記録をしまう",

    // 統一トーストメッセージ（useWishCard.ts直書きを messages.ts へ移設）
    TOAST_APPLY_SUCCESS: "手を挙げました。『つながり』画面で確認できます",
    TOAST_APPLY_ERROR: "上手く届きませんでした。少し時間をおいてもう一度お試しください",
    TOAST_APPROVE_SUCCESS: "願いを託しました",
    TOAST_APPROVE_ERROR: "承認に失敗しました。通信状態を確認してください",
    TOAST_UPDATE_SUCCESS: "更新しました",
    TOAST_UPDATE_ERROR: "更新に失敗しました",
    TOAST_CANCEL_SUCCESS_RESIGN: "そっと手を引きました。『足あと』画面から記録を確認できます",
    TOAST_CANCEL_SUCCESS_COMPENSATE: "お礼を渡して、願いをそっと取り下げました。記録は『足あと』画面から確認できます",
    TOAST_CANCEL_SUCCESS_DELETE: "願いをそっと取り下げました。記録は『足あと』画面から確認できます",
    TOAST_CANCEL_ERROR: "不具合により取り下げに失敗しました。時間をおいて再度お試しください",
    TOAST_CLEANUP_SUCCESS: "記録を整理しました",
    TOAST_CLEANUP_ERROR: "整理に失敗しました",
    TOAST_EMAIL_COPIED: "メールアドレスをコピーしました",
    TOAST_INCOMPLETE_PROFILE: "立候補には、プロフィールの登録（画像・30文字以上の自己紹介）または、ホームページやSNSのURLの登録が必要です",

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
    TXT_THANKS_DECAY_NOTE: "※時間経過と共に減少します",
    LBL_ECHO: "無償の願い", // 「無償処理」を排除

    // CardContact
    HDR_CONTACT_REQ: "相手の連絡先",
    HDR_CONTACT_HELP: "依頼主の連絡先",
    BTN_COPY: "アドレスをコピー",
    BTN_MAIL: "手紙を書く", // 「メールを作成する」から少し情緒的に
    TXT_NO_CONTACT: "連絡先は設定されていません",
    HDR_MEMO_REQ: "さんへのメモ",
    HDR_MEMO_HELP: "依頼者さんより",
    // ApplicantItem
    LBL_MALE: "男性",
    LBL_FEMALE: "女性",
    BTN_CHOOSE: "この人に託す", // 「お願いする」を統一
    LBL_ANONYMOUS: "匿名",
    LBL_YOU_ANONYMOUS: " (あなた)",
  },

  // 5. プロフィール・設定関連 (ProfileView / ProfileEditScreen)
  PROFILE: {
    LANG_TITLE: "言語設定",
    LANG_HELP: "表示言語を切り替えます",
    TITLE: "設定",
    SUBTITLE: "",
    EDIT_TITLE: "自己紹介",
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
    ARIA_EDIT: "自己紹介",
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
    TRUST_RECOVERY_1: "中断歴により、本来の称号が隠れています。",
    TRUST_RECOVERY_2: "回願いを叶えると、称号が復活します。",
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

  // 5b. 管理コンソール (Admin)
  ADMIN: {
    TITLE: "管理コンソール",
    SUBTITLE: "互助生態系モニター",
    TAB_MONITOR: "利用状況",
    TAB_USERS: "住民",
    TAB_INVITES: "招待",
    LOADING: "経済を読み込み中...",
    SEARCH_PLACEHOLDER: "住民を検索...",
    USER_COUNT: "%s 名を表示中",
    NO_USERS: "該当する住民が見つかりませんでした",
    SEARCH_PROMPT_1: "名前を入力して住民を検索してください",
    SEARCH_PROMPT_2: "※部分一致で検索可能です",
    SEARCHING: "検索中...",
    TABLE: {
      USER: "住民",
      STATUS: "状態",
      BALANCE: "Lm",
      ACTIONS: "操作",
    },
    ROLES: {
      ADMIN: "管理者",
      USER: "一般",
    },
    ALERT: {
      NEED_AT_LEAST_ONE_ADMIN: "システムには管理画面にアクセスできるユーザーが最低1人は必要です。",
      CONFIRM_ROLE_CHANGE: "⚠️ %s の権限を変更しますか？",
      ROLE_CHANGED: "権限を %s に変更しました。",
      CHANGE_FAILED: "変更に失敗しました",
    },
    MONITOR: {
      TOTAL_USERS: "総住民数",
      TOTAL_USERS_DESC: "現在生存しているアカウント数",
      TOTAL_SUPPLY: "総流通量 (Total Supply)",
      AVG_BALANCE: "平均残高: %s Lm",
      VOLUME_10D: "10日間 取引量 (Volume)",
      VOLUME_10D_DESC: "過去10日間に動いたLmの総量",
      OVERFLOW_10D: "10日間 溢出量 (Overflow)",
      OVERFLOW_10D_DESC: "上限を超えて大気に還った量",
      GIFT_10D: "10日間 想いの譲渡",
      GIFT_10D_DESC: "相手を指定して贈られた量",
      WISH_10D: "10日間 願いへの共鳴",
      WISH_10D_DESC: "願いに対して添えられた量",
      REBIRTH_10D: "10日間 再生 (Rebirth)",
      REBIRTH_10D_DESC: "過去10日でリセットを迎えた回数",
      ACTIVE_WISHES: "進行中の願い (Active Wishes)",
      HEAVY_WISH: "大いなる願い (1000Lm)",
      HEAVY_WISH_DESC: "時間を要する大きな手助け等",
      MEDIUM_WISH: "日常の願い (500Lm)",
      MEDIUM_WISH_DESC: "日常のちょっとした手助け",
      LIGHT_WISH: "無償の願い (0Lm)",
      LIGHT_WISH_DESC: "数字で測れない想いの交換",
      UNIT_COUNT: " 件",
      UNIT_TIMES: " 回",
    },
    INVITES: {
      TITLE: "招待状の管理",
      BTN_GENERATE: "コードを発行",
      NO_CODES: "まだ招待コードは発行されていません",
      CREATED_AT: "発行日時: %s",
      USED: "使用済み",
      USED_BY: "使用: %s...",
      AVAILABLE: "未使用",
      PLACEHOLDER: "メモ（誰に渡したか...）",
      COPY: "招待文をコピー",
      COPIED: "招待文をコピーしました",
      TEMPLATE: "重機（システム）から降りて、存在を祝うインフラへ。\nあなたを「Existence Ticker」の共同創始者として招待します。\n\n豊かさを求めて走り続けてきたけれど、\nたまにはその轟音を離れ、ただ「ここにいること」を祝う場所が必要です。\n\nまずは、このインフラの『Story（物語）』を読んでみてください:\n\n【扉を開ける鍵 (Invitation Code)】\n%s\n\n【扉はこちら】\n%s\n\nここから、新しい呼吸を始めましょう。",
      VERSION: "※招待コードは「ALPHA-XXXX」形式で自動生成され、Firestoreの「invitation_codes」コレクションに保存されます。",
    }
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
    GUIDE_LIGHT_TITLE: "[無償の願い]",
    GUIDE_LIGHT_SUB: "簡易な願い / 無償",
    GUIDE_LIGHT_DESC: "数分で完了する簡単な頼みごとや、挨拶程度のやりとり。\nLmを添えない（無償の願い）ことも可能です。",
    GUIDE_HYBRID_TITLE: "お金との境界線",
    GUIDE_HYBRID_1: "物品の購入費や交通費などは、直接現金や外部の決済手段でやりとりしてください。",
    GUIDE_HYBRID_2: "Lmは、あくまで「感謝の気持ち」として贈られるべきものです。",
    BTN_CLOSE: "閉じる",
  },

  AUTH_MODAL: {
    HEADER_COPY: "そのLmを誰かに届けるために",
    BTN_CLOSE: "戻る",
    BTN_LOGIN: "ログイン",
  },

  ACCOUNT_MODAL: {
    TITLE: "設定",
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
    NOTE_ANONYMOUS: "※願いを引き受けてもらった方だけに、あなたの名前が表示されます",
    BTN_SENDING: "送信中...",
    BTN_SUBMIT: "願いを公開する",
    BTN_CANCEL: "キャンセル",
    TIER_HEAVY_LABEL: "[大いなる願い]",
    TIER_HEAVY_SUB: "時間を要する、大きな手助けや頼みごと",
    TIER_MEDIUM_LABEL: "[日常の願い]",
    TIER_MEDIUM_SUB: "日常のなかでの、ちょっとした手助け",
    TIER_LIGHT_LABEL: "[無償の願い]",
    TIER_LIGHT_SUB: "数字では測れない、プライスレスな想いや温もりの交換",
    AI_DRAFT_BTN_IDLE: "下書き",
    AI_DRAFT_BTN_LOADING: "下書きを執筆中...",
    AI_DRAFT_PLACEHOLDER: "キーワード（例：引っ越しの段ボールを運んでほしい）",
    AI_DRAFT_ERROR: "下書きの作成に失敗しました",
    AI_DRAFT_SUGGESTION_LABEL: "💡例えば：",
    AI_DRAFT_SUGGESTIONS: [
      "電球交換の脚立押さえ",
      "重い買い物の手伝い",
      "一緒に空を見てほしい",
      "おすすめの映画を教えて",
      "ただ話を聞いてほしい",
      "一緒に散歩してほしい",
      "家具の組み立ての手伝い",
      "パソコンの簡単な設定",
      "庭の草むしりの手伝い",
      "一緒にご飯を食べてほしい",
      "ちょっとした相談に乗って",
      "ペットの散歩の同伴"
    ],
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
    TIER_LIGHT: "無償の願い",
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

    TOOLTIP_DISMISS_ALL: "すべてクリア",
    TOOLTIP_DISMISS: "閉じる",
    LOADING_WISH: "確認中...",
    WISH_NOT_FOUND: "この願いは、役目を終えました。",

    STATUS_GUIDE: {
      OPEN_REQ: "手を挙げてくれた方がいます。どなたに願いを託しますか？",
      OPEN_HELP: "現在、お返事を待っているところです。",
      IN_PROGRESS_REQ: "願いを託しました。無事に終わったら、ここから『ありがとう』を伝えてください。",
      IN_PROGRESS_HELP: "願いを託されました。無理のない範囲で、そっと寄り添ってあげてください。",
      FULFILLED_REQ: "このお願いは完了しました。温かい『ありがとう』を贈りました。",
      FULFILLED_HELP: "このお願いは完了しました。温かい『ありがとう』が届いています。",
      CANCELLED: "このお願いは、そっと閉じられました。",
    },
  },

  // 8. ナビゲーション・レイアウト (Header, Footer, SideDrawer)
  LAYOUT: {
    TAB_HOME: "ホーム",
    TAB_HISTORY: "軌跡",            // 「履歴」という無機質な言葉を排除
    TAB_PROFILE: "設定",            // 「アカウント」というシステム用語を排除
    RETURN_HOME: "ホームへ戻る",
    OPEN_MENU: "メニューを開く",
    SIDEDRAWER_ONBOARDING: "この場所について", // 「システム概要」を排除
    SIDEDRAWER_INSTALL: "ホーム画面に追加",
    SIDEDRAWER_TRUST: "約束ごと",    // 「利用規約」を排除
    SIDEDRAWER_FOOTER_NOTE: "設定と管理",
    HEADER_BALANCE: "Lm：",        // 「残高」を排除
    HEADER_DAYS_LEFT_PREFIX: "(満ちるまで ", // 「残り〇日」という焦燥感を排除
    HEADER_DAYS_LEFT_SUFFIX: "日)",
  },

  // 9a. 招待機能 (useInviteCode / ProfileView)
  INVITE: {
    SECTION_TITLE: "万年筆を手渡す",
    SECTION_SUB: "あなたの招待で、この場所に光が増えます",
    BTN_SEND: "万年筆を手渡す（招待状を送る）",
    BTN_GENERATING: "準備しています...",
    SLOT_LABEL: "招待状",
    SLOT_PENDING: "未使用",
    SLOT_USED: "届いた",
    SLOT_EMPTY: "空き",
    LIMIT_REACHED: "現在3枚の招待状が手元にあります。\n誰かが受け取った後、また新しく綴れます。",
    SHARE_TITLE: "Existence Ticker への招待",
    SHARE_TEXT: "損得のない、安らぎのインフラへ招待します。\n\n時間と共に静かに減っていく価値を、\n贈り合いながら生きる場所があります。\n\n【招待コード】\n%s\n\n【扉はこちら】\n%s\n\n—— Existence Ticker",
    COPY_SUCCESS: "招待状をコピーしました",
    COPY_FAIL: "コピーに失敗しました",
    ERROR_GENERATE: "招待コードの発行に失敗しました",
    CODE_LABEL: "招待コード",
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

    SLIDE3_TITLE: "願いと贈与",
    SLIDE3_P1: "手元のLmを添えて、",
    SLIDE3_P2: "世界に願いを公開することができます。",
    SLIDE3_LBL_REQ: "願いを放つ",
    SLIDE3_LBL_RES: "願いに寄り添う",

    SLIDE4_TITLE: "添えるLmの目安",
    SLIDE4_TIER1_TITLE: "[大いなる願い]",
    SLIDE4_TIER1_DESC: "時間を要する、大きな手助けや頼みごと",
    SLIDE4_TIER2_TITLE: "[日常の願い]",
    SLIDE4_TIER2_DESC: "日常のなかでの、ちょっとした手助け",
    SLIDE4_TIER3_TITLE: "[無償の願い]",
    SLIDE4_TIER3_DESC: "数字では測れない、プライスレスな想いや温もりの交換",

    SLIDE5_TITLE: "お金との境界線",
    SLIDE5_P1_1: "物品の購入費や交通費などの「現実の費用」は",
    SLIDE5_P1_2: "直接、当事者間でやりとりしてください。",
    SLIDE5_P4_1: "この場所が、皆さまにとって",
    SLIDE5_P4_2: "居心地の良い場所でありますように。",

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
    CH3_SUB: "あるがままの自然法則",
    CH3_P1_1: "管理者の役割は、この世界の「物理法則」を維持することのみにあります。",
    CH3_P1_G: "自然界における重力や潮の満ち引きと同様に、",
    CH3_P1_STRONG: "10日周期の「再生サイクル（呼吸）」は誰にも操作できない不変の法則",
    CH3_P1_2: "として固定されています。",
    CH3_OATH_TITLE: "管理者の誓い",
    CH3_OATH_1: "> 我々は経済を管理・コントロールしない",
    CH3_OATH_2: "> 我々は生命の呼吸（サイクル）には介入しない",
    CH3_OATH_3: "> ",
    CH3_OATH_4: "> 目的は「最適化」ではなく、「ただ在ること（存在）」の肯定である。",
    CH3_OATH_5: "> 豊かな世界とは、管理された指標の中ではなく、人々の自律的な結びつきの中に生み出される。",
    
    CH4_NUM: "04",
    CH4_TITLE: "理（ことわり）",
    CH4_1_TITLE: "4.1 不変の法則",
    CH4_1_SEC1_TITLE: "ℹ エネルギー還流",
    CH4_1_SEC1_P1_1: "本システムでは無作為な「あるがままの計算（Simple Physics）」を採用しています。個々の「願い（Committed Lm）」も時間とともに「深化」し、その価値を減じていきます。この際、持ち主の Available Lm が微増する現象が発生しますが、これは",
    CH4_1_SEC1_STRONG: "「深化によって願いがより純粋な形になり、余剰エネルギーが器に還流した」",
    CH4_1_SEC1_P1_2: "ものとして定義されます。この自然な還流を、我々は生態系の健全な呼吸として見守ります。",
    
    CH4_1_SEC2_TITLE: "V 静かなる重力",
    CH4_1_SEC2_P1_1: "一人の人間が保持できるエネルギーの限界点は ",
    CH4_1_SEC2_STRONG: "2400 Lm",
    CH4_1_SEC2_P1_2: " です。これを越えようとする力は「溢出（Overflow）」となり、世界を満たす生命の源として大気へ還ります。これは所有への執着を手放させる重力として機能します。",
    
    CH4_1_SEC3_TITLE: "⚠ 非介入の原則",
    CH4_1_SEC3_P1_1: "かつてこの世界には、代謝異常に介入しサイクルを「調律」する機能が存在していました。",
    CH4_1_SEC3_P1_2: "しかし、",
    CH4_1_SEC3_STRONG: "資本主義的な最適化・管理そのものがノイズである",
    CH4_1_SEC3_P1_3: "という気付きに至り、現在ではすべての調整機能が放棄されています。",
    CH4_1_SEC3_P1_4: "ただ10日で減り、ただ10日で満ちる。その自然の自浄作用にのみ、この世界のバランスは委ねられています。",
    
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
      INVITE_LINK: "アプリを開く",
      INVITE_LINK_SHORT: "開く",
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
