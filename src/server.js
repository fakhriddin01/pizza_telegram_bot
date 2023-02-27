import dotenv from "dotenv";
import { Markup, Telegraf } from "telegraf";
import { read_file, write_file } from "./utils/read_and_write.js";
import nodemailer from "nodemailer";


dotenv.config();

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PSW,
  },
});

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
bot.start(async (ctx) => {
  let users = read_file("users");
  if (!users.find((u) => u.user_id == ctx.update.message.chat.id)) {
    await ctx.reply("Emailingizni yuboring");
    users.push({
      user_id: ctx.update.message.chat.id,
      step: "email",
      username: ctx.update.chat.first_name,
    });
    write_file("users", users);
  } else {
    let current_users_id = ctx.update.message.chat.id;
    let activeusers = read_file("activeusers");
    activeusers[0][current_users_id] = ["main_page"];
    await ctx.reply(
      `Bo‘limni tanlang:`,
      Markup.keyboard([
        ["🛍 Buyurtma berish"],
        ["📖 Mening buyurtmalarim", "🍕 Filiallarimiz"],
        ["☎️ Qayta aloqa", "⚙️ Sozlamalar"],
      ]).resize()
    );
    write_file("activeusers", activeusers);
    return;
  }
});

bot.action("increase", async (ctx) => {
  let current_users_id = ctx.update.callback_query.from.id;
  let activeitems = read_file("activeitems");
  activeitems[0][current_users_id].qty += 1;
  let price =
    activeitems[0][current_users_id].qty *
    activeitems[0][current_users_id].price;
  write_file("activeitems", activeitems);

  await ctx.editMessageCaption(
    `Donar pizza kichkina \nDonar go‘shti va haqiqiy motsarella pishlog‘i solingan mazali va to‘yimli pitsa, \nNarxi: ${price} so'm`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("➖", "reduce"),
        Markup.button.callback(
          `${activeitems[0][current_users_id].qty}`,
          "Xohlayman😍"
        ),
        Markup.button.callback("➕", "increase"),
      ],
      [Markup.button.callback("Xohlayman😍", "Xohlayman😍")],
    ])
  );
  return;
});

bot.action("reduce", async (ctx) => {
  let current_users_id = ctx.update.callback_query.from.id;
  let activeitems = read_file("activeitems");
  if (activeitems[0][current_users_id].qty > 1) {
    activeitems[0][current_users_id].qty -= 1;
    let price =
      activeitems[0][current_users_id].qty *
      activeitems[0][current_users_id].price;
    await ctx.editMessageCaption(
      `Donar pizza kichkina \nDonar go‘shti va haqiqiy motsarella pishlog‘i solingan mazali va to‘yimli pitsa, \nNarxi: ${price} so'm`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("➖", "reduce"),
          Markup.button.callback(
            `${activeitems[0][current_users_id].qty}`,
            "Xohlayman😍"
          ),
          Markup.button.callback("➕", "increase"),
        ],
        [Markup.button.callback("Xohlayman😍", "Xohlayman😍")],
      ])
    );
    write_file("activeitems", activeitems);
  } else {
    ctx.answerCbQuery();
  }

  return;
});

bot.action("Xohlayman😍", async (ctx) => {
    let current_users_id = ctx.update.callback_query.from.id;
    let activeitems = read_file('activeitems');
    let savat = read_file('savat');
    if(!savat[0][current_users_id]){
        savat[0][current_users_id] = []
    }
    savat[0][current_users_id].push(activeitems[0][current_users_id]);
    write_file('savat', savat);
    activeitems[0][current_users_id]=null;
    write_file('activeitems', activeitems);
    ctx.tg.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id);
    ctx.tg.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id - 1);
    let activeusers = read_file('activeusers');
    activeusers[0][current_users_id].pop();
    write_file('activeusers', activeusers);
    await ctx.reply('Donar Pitsa mahsuloti savatga muvaffaqiyatli qo‘shildi 📥 Yana biror nima buyurtma qilamizmi?')
    await ctx.reply(`Pitsani tanlang 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["Donar Pitsa", "Salsa"],
          ["Gurme", "Super Miks"],
        ]).resize()
      );
    return;
});

bot.on("text", async (ctx) => {
  let users = read_file("users");
  let this_user = users.find((u) => u.user_id == ctx.update.message.chat.id);
  let current_users_id = ctx.update.message.chat.id;

  let activeusers = read_file("activeusers");
  if (activeusers[0][current_users_id]) {
    let menu = activeusers[0][current_users_id];
    if (ctx.update.message.text == "⬅️ Orqaga") {
      let activeitems = read_file("activeitems");

      if (activeitems[0][current_users_id]) {
        activeitems[0][current_users_id] = null;
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id - 1);
        ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id - 2);
      }

      activeusers[0][current_users_id].pop();
      write_file("activeitems", activeitems);
    }
    if (ctx.update.message.text == "⬅️ Orqaga" && menu.at(-1) == "main_page") {
      await ctx.reply(
        `Bo‘limni tanlang:`,
        Markup.keyboard([
          ["🛍 Buyurtma berish"],
          ["📖 Mening buyurtmalarim", "🍕 Filiallarimiz"],
          ["☎️ Qayta aloqa", "⚙️ Sozlamalar"],
        ]).resize()
      );
      write_file("activeusers", activeusers);
      return;
    }

    if(ctx.update.message.text == "🔁Tozalash"){
        let savat = read_file('savat');
        savat[0][current_users_id]=null;
        write_file('savat', savat);
        await ctx.reply("Sizning savatingiz boʻsh 😕 Keling, uni toʻldiramiz 📥");
        ctx.update.message.text = "🏃 Olib ketish";

    }

    if ( ctx.update.message.text == "📥 Savat" || ( ctx.update.message.text == "⬅️ Orqaga" && activeusers[0][this_user.user_id].at(-1) == "📥 Savat")) {
        if (activeusers[0][current_users_id].at(-1) != "📥 Savat") {
          activeusers[0][current_users_id].push("📥 Savat");
        }
        let savat = read_file('savat');
        let umumiy_narx=0;
        if(savat[0][current_users_id]==null){
            await ctx.reply("Sizning savatingiz boʻsh 😕 Keling, uni toʻldiramiz 📥");
            return;
        }
        for(let s of savat[0][current_users_id]){
            umumiy_narx += (s.qty * s.price);
        }
        await ctx.reply('📥 Savat:');
        await ctx.reply(`Tanlangan Filial: ${savat[0][current_users_id][0].filial}`);
        for(let s of savat[0][current_users_id]){
            await ctx.reply(`${s.qty} x ${s.name}`);
        }

        await ctx.reply(`Umumiy narx: ${umumiy_narx} so'm`, Markup.keyboard([
            ["⬅️ Orqaga", "➡️ Davom etish"],
            ["🔁Tozalash"]
        ]).resize());
        return;

    }

    if (ctx.update.message.text == "Donar Pitsa") {
      if (activeusers[0][current_users_id].at(-1) != "Donar Pitsa") {
        activeusers[0][current_users_id].push("Donar Pitsa");
      }
      ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id);
      ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id - 1);
      let pizzas = read_file("pizzas");
      let pizza = pizzas.find((p) => p.name == "Doner Pitsa");

      let activeitems = read_file("activeitems");
      activeitems[0][current_users_id] = {
        ...pizza,
        filial: activeusers[0][current_users_id].at(-3),
      };

      let price =
        activeitems[0][current_users_id].qty *
        activeitems[0][current_users_id].price;
      await ctx.reply(
        "Pitsa sonini tanlang:",
        Markup.keyboard([["⬅️ Orqaga"]]).resize()
      );
      await ctx.replyWithPhoto(
        { source: "./database/img/donarpitsa.jpg" },
        {
          caption: `Donar pizza kichkina \nDonar go‘shti va haqiqiy motsarella pishlog‘i solingan mazali va to‘yimli pitsa, \nNarxi: ${price} so'm`,
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback("➖", "reduce"),
              Markup.button.callback(
                `${activeitems[0][current_users_id].qty}`,
                "Xohlayman😍"
              ),
              Markup.button.callback("➕", "increase"),
            ],
            [Markup.button.callback("Xohlayman😍", "Xohlayman😍")],
          ]),
        }
      );
      write_file("activeusers", activeusers);
      write_file("activeitems", activeitems);
    }

    if (
      ctx.update.message.text == "🍕 Pitsa" ||
      (ctx.update.message.text == "⬅️ Orqaga" && menu.at(-1) == "🍕 Pitsa")
    ) {
      if (activeusers[0][current_users_id].at(-1) != "🍕 Pitsa") {
        activeusers[0][current_users_id].push("🍕 Pitsa");
      }

      await ctx.reply(
        `Pitsani tanlang 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["Donar Pitsa", "Salsa"],
          ["Gurme", "Super Miks"],
        ]).resize()
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (ctx.update.message.text == "☎️ Qayta aloqa") {
      await ctx.reply("📲 Yagona call-markaz: 1174 yoki (71) 203-66-66");
      write_file("activeusers", activeusers);
      return;
    }

    if (
      (ctx.update.message.text == "Bellissimo ECO" &&
        activeusers[0][this_user.user_id].at(-1) == "🏃 Olib ketish") ||
      (ctx.update.message.text == "⬅️ Orqaga" &&
        menu.at(-1) == "Bellissimo ECO" &&
        activeusers[0][this_user.user_id].at(-2) == "🏃 Olib ketish")
    ) {
      if (activeusers[0][current_users_id].at(-1) != "Bellissimo ECO") {
        activeusers[0][current_users_id].push("Bellissimo ECO");
      }
      await ctx.reply(
        "Bellissimo ECO \n📍 Temur Malik koʻchasi, 3A \n🕓 10:00 - 02:30"
      );
      await ctx.reply(
        `Sizni ko‘rganimizdan xursandmiz, ${this_user.username}! Bugun nima buyurtma qilasiz? 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["🍕 Pitsa", "🥤 Ichimliklar"],
          ["🔥 Qaynoq gazaklar", "🥗 Salatlar"],
          ["🍰 Desertlar", "⚪️ Souslar"],
        ])
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "Bellissimo Anhor" &&
      activeusers[0][this_user.user_id].at(-1) == "🏃 Olib ketish"
    ) {
      if (activeusers[0][current_users_id].at(-1) != "Bellissimo Anhor") {
        activeusers[0][current_users_id].push("Bellissimo Anhor");
      }
      await ctx.reply(
        "Bellissimo Anhor \n📍 Labzak koʻchasi, 12  \n🕓 10:00 - 21:50"
      );
      await ctx.reply(
        `Sizni ko‘rganimizdan xursandmiz, ${this_user.username}! Bugun nima buyurtma qilasiz? 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["🍕 Pitsa", "🥤 Ichimliklar"],
          ["🔥 Qaynoq gazaklar", "🥗 Salatlar"],
          ["🍰 Desertlar", "⚪️ Souslar"],
        ])
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "Bellissimo Sergeli" &&
      activeusers[0][this_user.user_id].at(-1) == "🏃 Olib ketish"
    ) {
      if (activeusers[0][current_users_id].at(-1) != "Bellissimo Sergeli") {
        activeusers[0][current_users_id].push("Bellissimo Sergeli");
      }
      await ctx.reply(
        "Bellissimo Sergeli \n📍 Sergeli-VIII dahasi, 21A  \n🕓 10:00 - 02:30"
      );
      await ctx.reply(
        `Sizni ko‘rganimizdan xursandmiz, ${this_user.username}! Bugun nima buyurtma qilasiz? 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["🍕 Pitsa", "🥤 Ichimliklar"],
          ["🔥 Qaynoq gazaklar", "🥗 Salatlar"],
          ["🍰 Desertlar", "⚪️ Souslar"],
        ])
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "Bellissimo Magic City" &&
      activeusers[0][this_user.user_id].at(-1) == "🏃 Olib ketish"
    ) {
      if (activeusers[0][current_users_id].at(-1) != "Bellissimo Magic City") {
        activeusers[0][current_users_id].push("Bellissimo Magic City");
      }
      await ctx.reply(
        "Bellissimo Magic City \n📍 Bobur koʻchasi, 174 \n🕓 10:00 - 21:50"
      );
      await ctx.reply(
        `Sizni ko‘rganimizdan xursandmiz, ${this_user.username}! Bugun nima buyurtma qilasiz? 🍕`,
        Markup.keyboard([
          ["⬅️ Orqaga", "📥 Savat"],
          ["🍕 Pitsa", "🥤 Ichimliklar"],
          ["🔥 Qaynoq gazaklar", "🥗 Salatlar"],
          ["🍰 Desertlar", "⚪️ Souslar"],
        ])
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "🏃 Olib ketish" ||
      (ctx.update.message.text == "⬅️ Orqaga" &&
        menu.at(-1) == "🏃 Olib ketish")
    ) {
      if (activeusers[0][current_users_id].at(-1) != "🏃 Olib ketish") {
        activeusers[0][current_users_id].push("🏃 Olib ketish");
      }
      await ctx.reply(
        "Buyurtmani qaerdan olib ketish siz uchun qulay? Lokatsiyani yoki saqlangan manzilni jo‘nating va biz sizga eng yaqin joylashgan filialni aniqlaymiz 🍕 📍",
        Markup.keyboard([
          ["⬅️ Orqaga", "📍 Eng yaqin filialni aniqlash"],
          ["Bellissimo ECO", "Bellissimo Magic City"],
          ["Bellissimo Sergeli", "Bellissimo Anhor"],
        ]).resize()
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (ctx.update.message.text == "Bellissimo ECO") {
      await ctx.reply(
        "Bellissimo ECO \n📍 Temur Malik koʻchasi, 3A \n🕓 10:00 - 02:30"
      );
      ctx.replyWithLocation(41.353343, 69.351149);
      write_file("activeusers", activeusers);
      return;
    }

    if (ctx.update.message.text == "Bellissimo Magic City") {
      await ctx.reply(
        "Bellissimo Magic City \n📍 Bobur koʻchasi, 174 \n🕓 10:00 - 21:50"
      );
      await ctx.replyWithLocation(41.303651, 69.245377);
      write_file("activeusers", activeusers);
      return;
    }

    if (ctx.update.message.text == "Bellissimo Sergeli") {
      await ctx.reply(
        "Bellissimo Sergeli \n📍 Sergeli-VIII dahasi, 21A \n🕓 10:00 - 02:30"
      );
      await ctx.replyWithLocation(41.221857, 69.222223);
      write_file("activeusers", activeusers);
      return;
    }
    if (ctx.update.message.text == "Bellissimo Anhor") {
      await ctx.reply(
        "Bellissimo Anhor \n📍 Labzak koʻchasi, 12 \n🕓 10:00 - 21:50"
      );
      await ctx.replyWithLocation(41.327104, 69.264718);
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "🍕 Filiallarimiz" ||
      (ctx.update.message.text == "⬅️ Orqaga" &&
        menu.at(-1) == "🍕 Filiallarimiz")
    ) {
      if (activeusers[0][current_users_id].at(-1) != "🍕 Filiallarimiz") {
        activeusers[0][current_users_id].push("🍕 Filiallarimiz");
      }
      await ctx.reply(
        "Filialni tanlang:",
        Markup.keyboard([
          ["Bellissimo ECO", "Bellissimo Magic City"],
          ["Bellissimo Sergeli", "Bellissimo Anhor"],
          ["⬅️ Orqaga"],
        ]).resize()
      );
      write_file("activeusers", activeusers);
      return;
    }

    if (
      ctx.update.message.text == "🛍 Buyurtma berish" ||
      (ctx.update.message.text == "⬅️ Orqaga" &&
        menu.at(-1) == "🛍 Buyurtma berish")
    ) {
      if (activeusers[0][current_users_id].at(-1) != "🛍 Buyurtma berish") {
        activeusers[0][current_users_id].push("🛍 Buyurtma berish");
      }
      await ctx.reply(
        "Buyurtmangizni mustaqil olib keting 🙋‍♂️ yoki yetkazish xizmatini tanlang 🚙",
        Markup.keyboard([
          ["🚙 Yetkazish", "🏃 Olib ketish"],
          ["⬅️ Orqaga"],
        ]).resize()
      );
      write_file("activeusers", activeusers);
      return;
    }
  } else {
    users.forEach(async (u) => {
      if (u.user_id == ctx.update.message.chat.id) {
        if (u.step == "email") {
          u.step = "email_send";
          u.email = ctx.update.message.text;
          u.try = 0;
          var val = Math.floor(1000 + Math.random() * 9000);
          u.code = val;
          const mailOptions = {
            from: "a.fakhriddin@gmail.com", // sender address
            to: ctx.update.message.text, // list of receivers
            subject: val, // Subject line
            html: `<h1>${val}</h1>`, // plain text body
          };

          transporter.sendMail(mailOptions, function (err, info) {
            if (err) console.log(err);
            else console.log(info);
          });

          write_file("users", users);

          await ctx.reply(
            `✅ Sizga kod jo‘natildi. Akkauntni faollashtirish uchun kodni kiriting`
          );
          return;
        }

        if (u.step == "email_send") {
          if (u.code == ctx.update.message.text) {
            u.step = "active";
            let current_user_id = ctx.update.message.chat.id;
            activeusers[0][current_user_id] = ["main_page"];
            write_file("activeusers", activeusers);
            await ctx.reply(
              `Bo‘limni tanlang:`,
              Markup.keyboard([
                ["🛍 Buyurtma berish"],
                ["📖 Mening buyurtmalarim", "🍕 Filiallarimiz"],
                ["☎️ Qayta aloqa", "⚙️ Sozlamalar"],
              ]).resize()
            );
          } else if (u.try != 3) {
            u.try += 1;
            await ctx.reply(
              `❌ Afsus... Siz kodni xato kiritdingiz, qayta urinib ko‘ring`
            );
          }
          if (u.try == 3) {
            u.step = "email";
            await ctx.reply(
              `👇😉 Noto’g’ri kodni juda koʻp marta kiritganga oʻxshaysiz.  Email noto’g’ri kiritilgan bo’lsa, uni o’zgarttirishga urinib ko’ring: ${u.email}, emailni boshqattan jo'nating!`
            );
          }
          write_file("users", users);
          return;
        }
      }
    });
  }

  // if(current_user.step == "email"){
  //     console.log(ctx.update.message.text);
  //     current_user.step="email_send";
  //     current_user = {...current_user, email: ctx.update.message.text }
  //     users.for
  // write_file('users', users)
});

bot.launch();
