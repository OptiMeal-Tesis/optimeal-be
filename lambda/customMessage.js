/**
 * AWS Lambda function for customizing Cognito email messages
 * 
 * This function intercepts Cognito's email messages and customizes them
 * with a beautiful HTML template and proper verification link.
 * 
 * Trigger: CustomMessage (Cognito User Pool)
 */

exports.handler = async (event) => {
    console.log('CustomMessage trigger invoked:', event.triggerSource);

    // Handle sign-up verification email
    if (event.triggerSource === 'CustomMessage_SignUp') {
        const email = event.request.userAttributes.email;
        const code = event.request.codeParameter;
        const verificationUrl = `https://optimeal-be.vercel.app/api/auth/confirm?email=${encodeURIComponent(email)}&code=${code}`;

        event.response.emailSubject = 'Verificación de Cuenta en OptiMeal';
        event.response.emailMessage = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Verificación de Cuenta - OptiMeal</title>
</head>
<body style="margin:0; padding:0; background-color:#F7F8FB; font-family:'Futura', Helvetica, Arial, sans-serif; color:#1E1E1E;">

 <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F8FB" style="margin:0; padding:40px 0;">
   <tr>
     <td align="center">

       <img src="https://optimeal-s3bucket.s3.us-east-1.amazonaws.com/logo.png"
            alt="OptiMeal"
            width="120"
            style="height:auto; margin-bottom:28px; display:block;" />

       <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:92%; background-color:#FFFFFF; border-radius:16px;">
         <tr>
           <td style="padding:36px 28px; text-align:center;">

             <h1 style="font-size:24px; margin:0 0 16px; font-weight:700; color:#1E1E1E;">
               ¡Bienvenido a OptiMeal!
             </h1>

             <p style="margin:0 0 28px; font-size:16px; line-height:24px; color:#45556C;">
               Gracias por registrarte. Para activar tu cuenta, hacé clic en el botón de abajo:
             </p>

             <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 8px;">
               <tr>
                 <td style="border:2px solid #414BB5; border-radius:10px; padding:0; text-align:center;">
                   <a href="${verificationUrl}" 
                      style="display:block; padding:12px 28px; text-decoration:none; font-weight:600; font-size:15px; color:#414BB5; font-family:'Futura', Helvetica, Arial, sans-serif;">
                     Verificar cuenta
                   </a>
                 </td>
               </tr>
             </table>

           </td>
         </tr>
       </table>

       <p style="margin:24px 0 0; font-size:12px; color:#9AA2B1;">
         Si no creaste esta cuenta, ignorá este correo.<br/>
         © OptiMeal
       </p>

     </td>
   </tr>
 </table>

</body>
</html>
    `;
    }

    // Handle forgot password email
    if (event.triggerSource === 'CustomMessage_ForgotPassword') {
        const code = event.request.codeParameter;

        event.response.emailSubject = 'Recuperación de Contraseña - OptiMeal';
        event.response.emailMessage = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Recuperación de Contraseña - OptiMeal</title>
</head>
<body style="margin:0; padding:0; background-color:#F7F8FB; font-family:'Futura', Helvetica, Arial, sans-serif; color:#1E1E1E;">

 <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F8FB" style="margin:0; padding:40px 0;">
   <tr>
     <td align="center">

       <img src="https://optimeal-s3bucket.s3.us-east-1.amazonaws.com/logo.png"
            alt="OptiMeal"
            width="120"
            style="height:auto; margin-bottom:28px; display:block;" />

       <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:92%; background-color:#FFFFFF; border-radius:16px;">
         <tr>
           <td style="padding:36px 28px; text-align:center;">

             <h1 style="font-size:24px; margin:0 0 16px; font-weight:700; color:#1E1E1E;">
               Recuperación de Contraseña
             </h1>

             <p style="margin:0 0 28px; font-size:16px; line-height:24px; color:#45556C;">
               Recibimos una solicitud para restablecer tu contraseña. Tu código de verificación es:
             </p>

             <div style="background-color:#F7F8FB; padding:16px; border-radius:8px; margin:0 auto 28px; max-width:200px;">
               <p style="margin:0; font-size:32px; font-weight:700; color:#414BB5; letter-spacing:8px;">
                 ${code}
               </p>
             </div>

             <p style="margin:0; font-size:14px; line-height:20px; color:#45556C;">
               Este código expira en 24 horas.
             </p>

           </td>
         </tr>
       </table>

       <p style="margin:24px 0 0; font-size:12px; color:#9AA2B1;">
         Si no solicitaste este cambio, ignorá este correo.<br/>
         © OptiMeal
       </p>

     </td>
   </tr>
 </table>

</body>
</html>
    `;
    }

    return event;
};

