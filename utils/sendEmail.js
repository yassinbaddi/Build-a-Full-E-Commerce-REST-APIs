const { createTransport } = require("nodemailer");

const transporter = createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
    },
});

const sendEmail = async (options) => {
    try {
        const info = await transporter.sendMail({
            from: "onboarding@resend.dev",
            to: "yassinepool55@gmail.com",
            subject: "Hello",
            text: "Hello world?",
            html: `<h2>Code: ${options}</h2>`,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (err) {
        console.error("Error while sending mail:", err);
        return false;
    }
};

module.exports = sendEmail;
