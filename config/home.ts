export const homeSteps = [
  {
    title: "Файлы — с вас",
    text: "Загрузите документы или фотографии с телефона.",
  },
  {
    title: "Параметры — на выбор",
    text: "Укажите бумагу, цвет, количество копий и срок получения.",
  },
  {
    title: "Печать — с нас",
    text: "Следите за статусом в «Моих заказах», затем заберите и оплатите заказ в копицентре.",
  },
] as const;

export const homeServices = [
  {
    kind: "document",
    title: "Для дел",
    text: "Учёба, работа, документы. Цветная и чёрно-белая печать А4.",
    formats: "PDF / DOCX / XLSX",
  },
  {
    kind: "photo",
    title: "Для памяти",
    text: "Любимые фотографии — на фотобумаге, а не только в телефоне.",
    formats: "JPG / PNG",
  },
] as const;

export const homeLocation = {
  street: "на Изотова, 7",
  area: "Горловка · Центральный рынок",
  directions:
    "Рядом с ТД «Донбасс» и магазином «Максим». Ищите зелёную вывеску с информацией о ксерокопии.",
  mapUrl: "https://yandex.ru/maps/?rtext=~48.303479,38.033977&rtt=pedestrian",
  hoursNote: "Перед визитом уточните часы работы в сообщениях.",
} as const;

export const homeContacts = [
  { label: "Telegram", url: "https://t.me/fotomail24" },
  { label: "ВКонтакте", url: "https://vk.com/kopibara24" },
] as const;

export const homePickupDetails = [
  {
    kind: "status",
    title: "Проверьте готовность",
    text: "Статус заказа — в «Моих заказах».",
  },
  {
    kind: "payment",
    title: "Оплатите при получении",
    text: "Заказ оплачивается в копицентре, когда забираете готовую печать.",
  },
] as const;
