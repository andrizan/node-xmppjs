// Client is the actual Client class, xml is a convenience function for building
// valid XML.
// const debug = require("@xmpp/debug");
const { client, xml, jid } = require("@xmpp/client");
const mongoose = require('mongoose');
const CryptoJS = require("crypto-js");
const db = require('./config/db.config');
const Chat = require('./app/models/Chat');
const JabberAccount = require('./app/models/JabberAccount');
const secretKey = "NlPVHl45ojDhzuc2Yw4nBFZJXtbNko2K";

const xmpp = client(
  {
    service: "xmpp://616.pub:5222",
    username: "slime2",
    password: "12345678",
  }
);

// koneksi Ke Database
mongoose.connect(db.url, {
  useNewUrlParser: true,
})
  .then(() => {
    console.log("database connected");
  }).catch(err => {
    console.log(err);
    process.exit();
  });
// Node doesn't like self-signed certificates. You could also pass this as an
// environment variable.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Here we get into the event-based actions.
// I'm logging everything so that you can see what's getting passed through at
// each of these stages. It gets pretty interesting and looking at this helped me a
// ton when doing some debugging.
xmpp.on('error', err => console.log('ERROR:', err.toString));

xmpp.on('status', status => console.log('STATUS:', status));

xmpp.on('input', input => console.log('INPUT:', input));

xmpp.on('output', output => console.log('OUTPUT:', output));

// Most of the magic happens here. You can set up all your conditions for the
// various XMPP stanzas that you receive. You can be creative with this, for
// instance you could have the bot running on a Raspberry Pi and change
// some status LED's based on the message.
xmpp.on('stanza', stanza => {
  console.log('STANZA:', JSON.stringify(stanza.toJSON()));

  // This acts on requests from other clients to watch the status of this bot
  // so that the other client can see whether or not this bot is online.
  if (stanza.is('presence') && stanza.attrs.type === 'subscribe') {
    xmpp.send(
      xml('presence', { to: stanza.attrs.from, type: 'subscribed' })
    );
  }

  // This is doing the echoing.
  if (stanza.is('message') && stanza.attrs.from !== xmpp.jid) {
    stanza.children.forEach(child => {
      if (child.name === 'body') {
        const jid = stanza.attrs.from;
        const msg = child.children.join('\n');

        xmpp.send(
          xml('message', { to: jid, type: 'chat' },
            xml('body', {}, 'pesan sedang diproses')
          )
        );

        if (msg.match(/#SAVEMSG/g)) {
          Chat.create({ jid, msg })
            .then(function (result) {
              xmpp.send(
                xml('message', { to: jid, type: 'chat' },
                  xml('body', {}, `pesan berhasil disimpan [${result}]`)
                )
              );
            }, function (err) {
              xmpp.send(
                xml('message', { to: jid, type: 'chat' },
                  xml('body', {}, err)
                )
              );
            });
        } else if (msg.match(/#GETACCOUNT/g)) {
          JabberAccount.find().then(function (result) {
            console.log(result);
            xmpp.send(
              xml('message', { to: jid, type: 'chat' },
                xml('body', {}, result)
              )
            );
          })
        } else if (msg.match(/#help/i)) {
          xmpp.send(
            xml('message', { to: jid, type: 'chat' },
              xml('body', {}, "#GETACCOUNT [Ambil semua data akun yang terdaftar]")
            )
          );
          xmpp.send(
            xml('message', { to: jid, type: 'chat' },
              xml('body', {}, "#SAVEMSG [Simpan pesan]")
            )
          );
          xmpp.send(
            xml('message', { to: jid, type: 'chat' },
              xml('body', {}, "#SAVEACCOUNT [Tambah akun baru]")
            )
          );
        } else if (msg.match(/#SAVEACCOUNT/g)) {
          let data = msg.split('#');

          JabberAccount.create(
            {
              jid: data[2],
              username: data[3],
              password: encrypt(data[4]),
              host: data[5],
              port: data[6],
              status: data[7],
            })
            .then(function () {
              xmpp.send(
                xml('message', { to: jid, type: 'chat' },
                  xml('body', {}, 'Akun berhasil disimpan ' + decrypt(encrypt(data[4])))
                )
              );
            }, function (err) {
              xmpp.send(
                xml('message', { to: jid, type: 'chat' },
                  xml('body', {}, `Akun gagal disimpan [${err}]`)
                )
              );
            });
        } else {
          xmpp.send(
            xml('message', { to: jid, type: 'chat' },
              xml('body', {}, 'Perintah tidak ditemukan')
            )
          );
        }

      }
    });
  }
});

// When the bot comes online it updates its status to let you know that it's
// ready to talk back to you.
xmpp.on('online', jid => {
  console.log('ONLINE:', jid.toString());
  xmpp.send(
    xml('presence', {},
      xml('show', {}, 'chat'),
      xml('status', {}, 'Saya Online'),
    )
  );
});

// This is just handling the client authentication.
// xmpp.handle('authenticate', authenticate => {
//   return authenticate('echo_bot', 'password');
// });

xmpp
  .start('xmpp://localhost:5222')
  .catch(err => console.error('start failed', err.message));

function encrypt(data) {
  let result = CryptoJS.AES.encrypt(data, secretKey).toString();
  return result;
}

function decrypt(data) {
  let result = CryptoJS.AES.decrypt(data, secretKey).toString(CryptoJS.enc.Utf8);
  return result;
}
