export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "responded";
}
