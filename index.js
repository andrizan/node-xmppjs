// Client is the actual Client class, xml is a convenience function for building
// valid XML.
const { client, xml, jid } = require("@xmpp/client");
// const debug = require("@xmpp/debug");

const xmpp = client({
  service: "xmpp://chatserver.space:5222",
  username: "riski",
  password: "12345678",
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
        const response = child.children.join('\n');
        if (response == 'start') {
          xmpp.send(
            xml('message', { to: stanza.attrs.from, type: 'chat' },
              xml('body', {}, 'Ok, Robot iki wes melaku. opo seng kuwe butohno')
            )
          );
        } else {
          xmpp.send(
            xml('message', { to: stanza.attrs.from, type: 'chat' },
              xml('body', {}, 'perintah seng nok ketekno rak ono')
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
      xml('status', {}, 'I say everything you do!'),
    )
  );
});

// This is just handling the client authentication.
// xmpp.handle('authenticate', authenticate => {
//   return authenticate('echo_bot', 'password');
// });

// This actually launches the server.
xmpp
  .start('xmpp://localhost:5222')
  .catch(err => console.error('start failed', err.message));

