export const FIRST_ORDER_DISCOUNT_PERCENT = 15;
export const getFirstOrderStaffReminder = (
  discountPercent = FIRST_ORDER_DISCOUNT_PERCENT
) =>
  `Первый заказ клиента. Обязательно примените скидку ${discountPercent}% от стоимости заказа при оплате.`;
export const FIRST_ORDER_STAFF_REMINDER = getFirstOrderStaffReminder();
