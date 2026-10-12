import type { Metadata } from "next";
import { ServicesPage } from "./services-page";

export const metadata: Metadata = {
  title: "Услуги и наши работы — Capy Print",
  description:
    "Печать, фото на документы, реставрация фотографий, дизайн, сувениры и адресные таблички. Копицентр в Горловке, Изотова, 7.",
};

const Services = () => <ServicesPage />;

export default Services;
