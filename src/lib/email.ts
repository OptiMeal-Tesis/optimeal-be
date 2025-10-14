import nodemailer from 'nodemailer';
import { OrderStatus } from '@prisma/client';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  private static initializeTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  static async sendOrderStatusEmail(
    userEmail: string,
    orderId: number,
    newStatus: OrderStatus,
    logoUrl?: string,
    userName?: string
  ): Promise<void> {
    try {
      const transporter = this.initializeTransporter();

      // Validate required environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration is missing');
      }

      const subject = 'Actualización de estado de tu pedido';
      const statusText = this.getStatusText(newStatus);
      const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="margin-bottom: 20px;">` : '';
      const greeting = userName ? `Hola ${userName},` : 'Hola,';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#F7F8FB; font-family:'Futura', Helvetica, Arial, sans-serif; color:#1E1E1E;">

        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F8FB" style="margin:0; padding:40px 0;">
        <tr>
        <td align="center">

            ${logoHtml ? `<img src="${logoUrl}" alt="OptiMeal" width="120" style="height:auto; margin-bottom:28px; display:block; max-width:120px; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; object-fit: contain;" />` : ''}

            <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:92%; background-color:#FFFFFF; border-radius:16px;">
            <tr>
                <td style="padding:36px 28px; text-align:center;">

                <h1 style="font-size:24px; margin:0 0 16px; font-weight:700; color:#0D47A1;">
                    ${subject}
                </h1>

                <p style="margin:0 0 16px; font-size:16px; line-height:24px; color:#45556C;">
                    ${greeting}
                </p>

                <p style="margin:0 0 28px; font-size:16px; line-height:24px; color:#45556C;">
                    El estado de tu pedido #${orderId} fue actualizado a:
                </p>

                <div style="background-color:#F7F8FB; padding:16px; border-radius:8px; margin:0 auto 28px; max-width:200px;">
                    <p style="margin:0; font-size:20px; font-weight:700; color:${this.getStatusColor(newStatus)}; letter-spacing:2px;">
                    ${statusText}
                    </p>
                </div>

                <p style="margin:0; font-size:16px; line-height:24px; color:#45556C;">
                    Gracias por elegirnos.
                </p>

                </td>
            </tr>
            </table>

            <p style="margin:24px 0 0; font-size:12px; color:#9AA2B1;">
            Este es un mensaje automático, por favor no respondas a este correo.<br/>
            © OptiMeal
            </p>

        </td>
        </tr>
        </table>

        </body>
        </html>`;

      const mailOptions = {
        from: `"Optimeal" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${userEmail} for order #${orderId}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get human-readable status text in Spanish
   */
  private static getStatusText(status: OrderStatus): string {
    const statusMap = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.PREPARING]: 'En preparación',
      [OrderStatus.READY]: 'Listo',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };
    return statusMap[status] || status;
  }

  /**
   * Get color for status display
   */
  private static getStatusColor(status: OrderStatus): string {
    const colorMap = {
      [OrderStatus.PENDING]: '#ffa500',
      [OrderStatus.PREPARING]: '#2196f3',
      [OrderStatus.READY]: '#4caf50',
      [OrderStatus.DELIVERED]: '#8bc34a',
      [OrderStatus.CANCELLED]: '#f44336',
    };
    return colorMap[status] || '#333';
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.initializeTransporter();
      await transporter.verify();
      console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }
}
