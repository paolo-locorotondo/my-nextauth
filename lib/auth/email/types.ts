export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Implementa questa interfaccia per aggiungere un nuovo provider email. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
