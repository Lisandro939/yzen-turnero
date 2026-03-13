import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

export async function sendNewUserNotification(
    email: string,
    name?: string | null,
) {
    await transporter.sendMail({
        from: `"Turnero App" <${process.env.MAIL_USER}>`,
        to: ["lisandrofernandez2705@gmail.com", "lucasbarello125@gmail.com"],
        subject: "Nuevo usuario registrado en Turnero",
        text: `Se registró un nuevo usuario:\n\nEmail: ${email}\nNombre: ${name ?? "N/A"}`,
        html: `<p>Se registró un nuevo usuario:</p><ul><li><b>Email:</b> ${email}</li><li><b>Nombre:</b> ${name ?? "N/A"}</li></ul>`,
    });
}
