import { Config } from "@/config";

export const MAIN_MENU_KEYBOARD = {
  inline_keyboard: [
    [
      {
        text: "🖨 Открыть приложение",
        web_app: { url: Config.miniAppUrl! },
      },
    ],
    [
      { text: "🕐 Режим работы", callback_data: "hours" },
      { text: "📍 Как добраться", callback_data: "address" },
    ],
    [
      { text: "📞 Контакты", callback_data: "contacts" },
      { text: "❓ Частые вопросы", callback_data: "faq" },
    ],
  ],
};

export const BACK_KEYBOARD = {
  inline_keyboard: [[{ text: "Главное меню", callback_data: "main_menu" }]],
};
