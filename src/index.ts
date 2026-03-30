import { Client, GatewayIntentBits, Events, AttachmentBuilder } from "discord.js";
import type { Message } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
import { Readable } from 'node:stream';
import { spawn } from "child_process";
import dotenv from "dotenv";
import compose from "./compose.js";

dotenv.config();
const TOKEN = process.env.TOKEN;
const VOICE_PREFIX = "dv!";
const CHAT_PREFIX = "dc!";
const FILE_MAXSIZE = 8 * 1000 * 1000

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

export async function ready(token: string | undefined): Promise<boolean> {
    client.on(Events.MessageCreate, async(message: Message) => {
        const mes = message.content;
        const member = message.member;
        if (message.author.bot || !member || !(mes.startsWith(VOICE_PREFIX) || mes.startsWith(CHAT_PREFIX))) {
            return;
        }
        const channel = member.voice.channel;
        const voiceChannel = mes.startsWith(VOICE_PREFIX) && !!channel;
        const command = mes.slice(3);
        if (command.length > 1000) {
            await message.reply("コマンドが長すぎます。");
            return;
        }
        if (command.trim() === "help") {
            message.reply(
                "```" +
                "文法\n" + 
                "dc!でメッセージを始め、MMLという記法で楽譜を記述すると音楽を再生できます。\n" +
                "CDEFGABR それぞれドレミファソラシと休符に対応し、音を鳴らします。直後に数字を指定するとn分音符を鳴らします。ピリオドを付けると付点音符になります。\n" + 
                "L デフォルトの音の長さをn分音符形式で指定します。\n" + 
                "T テンポを指定します。デフォルトは120です。\n" +
                "@ 音を指定します。カンマ区切りでパラメータを指定します。複数指定すると音が重なります。パラメータは以下の通りです。(内容=デフォルト値)\n" +
                "(波形),(音量=100),(オクターブ=±0),(デチューン=100)\n" +
                "波形は以下の通りです。\n" +
                "0: 矩形波(デューティー比50%), 1: 矩形波(デューティー比25%), 2: 矩形波(デューティー比12.5%), 3: 三角波, 4: ノコギリ波, 5: サイン波, 6: ノイズ\n" +
                "< オクターブを上げます。\n" +
                "> オクターブを下げます。\n" +
                "() 括弧内の音階を同時に鳴らします。\n" +
                "yn 音を減衰させます。nが大きいほどより速く減衰します。\n" +
                "wn 音高を途中で変化させます。nが100より大きければ高く、小さければ低くなります。\n" +
                "vn 音量を変更します。デフォルトでは100です。\n" +
                "[]n 括弧内の命令をn回繰り返します。ただし0を指定しても必ず1回は実行します。\n" +
                "; 音を書き込む位置を先頭に戻します。また、音がデフォルトに戻ります。\n\n" +
                "dc!から開始する代わりにdv!から開始するとボイスチャンネルで音声を再生します。" +
                "```"
            );
            return;
        }

        const result = compose(command);
        if (result === null) {
            message.reply("音声の生成に失敗しました。");
            return;
        } else if (voiceChannel) {
            if (channel === null) {
                message.reply("チャンネル情報の取得に失敗しました。");
            } else {
                const resource = createAudioResource(Readable.from(result));
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator
                });
                const player = createAudioPlayer({behaviors: { noSubscriber: NoSubscriberBehavior.Pause }});
                player.on(AudioPlayerStatus.Idle, () => {
                    connection.destroy();
                });
                connection.subscribe(player);
                player.play(resource);
            }
        } else {
            message.reply("音声の生成に成功しました。エンコードしています…");
            const ffmpeg = spawn("ffmpeg", [
                "-i", "pipe:0",
                "-vn",
                "-f", "mp3",
                "-ac", "1",
                "-ab", "192k",
                "-ar", "44100",
                "-acodec", "libmp3lame",
                "pipe:1"
            ], {
                stdio: ["pipe", "pipe", "pipe"]
            });
            let mp3 = Buffer.alloc(0);
            ffmpeg.stdout.on("data", (data: Buffer) => {
                mp3 = Buffer.concat([mp3, data]);
            });
            ffmpeg.on("close", () => {
                if (mp3.length > FILE_MAXSIZE) {
                    message.reply("容量が大きすぎます。");
                    return;
                }
                message.reply({
                    files: [new AttachmentBuilder(mp3).setName("result.mp3")]
                });
            });
            ffmpeg.stdin.write(result);
            ffmpeg.stdin.end();
        };
    });

    if (!token) {
        return false;
    } else {
        await client.login(token);
        return true;
    };
}

(async function() {
    console.log(await ready(TOKEN));
})();