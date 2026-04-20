"""
Srtatifyx Telegram Bot
Команда /verify +79991234567 — верифицирует номер телефона и отправляет OTP
"""
import logging
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ─── Настройки ───────────────────────────────────────────────────────────────
BOT_TOKEN   = "8760328169:AAFKE5VMDIoaukzjyhg_m_gI9bNj3h6Hmvs"
SB_URL      = "https://rtrmsucwdujlglglowiz.supabase.co/rest/v1"
SB_KEY      = "sb_publishable_BAgd-FVcacSxjk8HLoVFKg_CWWuxlvD"
HEADERS     = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO
)
log = logging.getLogger(__name__)


def normalize_phone(raw: str) -> str:
    """Нормализует номер: 89991234567 → +79991234567"""
    p = raw.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if p.startswith("8") and len(p) == 11:
        p = "+7" + p[1:]
    if not p.startswith("+"):
        p = "+" + p
    return p


def sb_get(path: str) -> list:
    r = requests.get(f"{SB_URL}/{path}", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


def sb_patch(table: str, filter_qs: str, data: dict):
    r = requests.patch(
        f"{SB_URL}/{table}?{filter_qs}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=data,
        timeout=10
    )
    r.raise_for_status()


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Привет! Я бот платформы *Srtatifyx*.\n\n"
        "Для верификации номера телефона при регистрации отправьте команду:\n"
        "`/verify +79991234567`\n\n"
        "_(используйте номер телефона вашего Telegram-аккаунта)_",
        parse_mode="Markdown"
    )


async def cmd_verify(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    args = ctx.args  # список аргументов после /verify

    if not args:
        await update.message.reply_text(
            "❌ Укажите номер телефона.\n"
            "Пример: `/verify +79991234567`",
            parse_mode="Markdown"
        )
        return

    phone_raw = " ".join(args)
    phone = normalize_phone(phone_raw)

    # Валидация формата
    if not (phone.startswith("+") and phone[1:].isdigit() and 10 <= len(phone) <= 16):
        await update.message.reply_text(
            f"❌ Некорректный номер: `{phone_raw}`\n"
            "Формат: `+79991234567`",
            parse_mode="Markdown"
        )
        return

    log.info(f"[/verify] chat_id={chat_id} phone={phone}")

    try:
        # Ищем запись в tg_logs
        rows = sb_get(
            f"tg_logs?phone=eq.{requests.utils.quote(phone)}"
            f"&status=eq.pending&select=id,otp,expires_at&order=sent_at.desc&limit=1"
        )

        if not rows:
            await update.message.reply_text(
                f"⚠️ Запрос на верификацию для номера `{phone}` не найден.\n\n"
                "Убедитесь, что:\n"
                "1. Вы начали регистрацию на сайте\n"
                "2. Ввели тот же номер телефона\n"
                "3. Прошло не более 5 минут",
                parse_mode="Markdown"
            )
            return

        row = rows[0]
        otp = row["otp"]
        log_id = row["id"]

        # Обновляем запись: сохраняем chat_id и ставим verified
        sb_patch(
            "tg_logs",
            f"id=eq.{log_id}",
            {"chat_id": chat_id, "status": "verified"}
        )

        # Отправляем код пользователю
        await update.message.reply_text(
            f"✅ Номер `{phone}` подтверждён!\n\n"
            f"🔐 Ваш код верификации:\n\n"
            f"`{otp}`\n\n"
            f"Введите его на сайте. Код действителен 5 минут.",
            parse_mode="Markdown"
        )

        log.info(f"[/verify] OK — phone={phone} otp={otp} chat_id={chat_id}")

    except requests.exceptions.RequestException as e:
        log.error(f"[/verify] Supabase error: {e}")
        await update.message.reply_text(
            "⚠️ Ошибка сервера. Попробуйте через минуту."
        )
    except Exception as e:
        log.error(f"[/verify] Unexpected error: {e}")
        await update.message.reply_text("⚠️ Что-то пошло не так. Попробуйте снова.")


async def fallback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Используйте команду:\n`/verify +79991234567`",
        parse_mode="Markdown"
    )


def main():
    log.info("Starting Srtatifyx Bot...")
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("verify", cmd_verify))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback))
    log.info("Bot is polling...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
