// createapi.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const crypto = require("crypto");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createapi")
        .setDescription("Create a new API code for your application.")
        .addStringOption(option =>
            option
                .setName("ten_app")
                .setDescription("Application name to create API")
                .setRequired(true)
        ),

    async execute(interaction) {
        const appName = interaction.options.getString("ten_app");
        const db = JSON.parse(fs.readFileSync("./db.json", "utf8"));

        if (!db.apis) db.apis = [];

        // ❌ Trùng tên app
        if (db.apis.some(api => api.appName.toLowerCase() === appName.toLowerCase())) {
            return interaction.reply({
                content: `❌ Application name **"${appName}"** already exists.`,
                ephemeral: true
            });
        }

        // ================= DISABLE ALL OLD API =================
        db.apis.forEach(api => {
            api.status = "disabled";
            api.disabledAt = new Date().toISOString();
        });

        // ================= CREATE NEW API =================
        const newApiKey = crypto.randomBytes(16).toString("hex");

        const newApi = {
            appName: appName,
            apiKey: newApiKey,
            ownerId: interaction.user.id,
            status: "active",
            createdAt: new Date().toISOString()
        };

        db.apis.push(newApi);

        fs.writeFileSync("./db.json", JSON.stringify(db, null, 2));

        // ================= EMBED =================
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("✅ CREATE API SUCCESS")
            .setDescription(
                `A new API has been created successfully.\n\n` +
                `⚠️ **All old APIs have been disabled automatically**`
            )
            .addFields(
                { name: "Application", value: appName, inline: true },
                { name: "Status", value: "🟢 Active", inline: true },
                { name: "API Key (Save carefully)", value: `\`\`\`${newApiKey}\`\`\`` }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
