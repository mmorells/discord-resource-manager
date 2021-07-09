const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
client.login('TOKEN');

let storage = [];
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
	const prefix = "bot";
	if (!message.content.startsWith(prefix)) { return; }
	messages = message.content.split("\n");
	
	toSend = [];
	if (messages.length > 1) {
		messages.forEach(m => {
			const args = m.slice(prefix.length).trim().split(' ');
			const command = args.shift().toLowerCase();
			res = parseMessage(command, args, message.author);
			toSend.push(res);
		});
	} else {
		const args = message.content.slice(prefix.length).trim().split(' ');
		const command = args.shift().toLowerCase();
		res = parseMessage(command, args, message.author);
		toSend.push(res);
	}

	toSendTemp = toSend.toString().replace(/,/g, '\n');
	if (toSendTemp.length > 2000) {
		const half = Math.ceil(toSend.length / 2);    
		const firstHalf = toSend.splice(0, half)
		const secondHalf = toSend.splice(-half)
		message.channel.send(firstHalf.toString().replace(/,/g, '\n'));
		message.channel.send(secondHalf.toString().replace(/,/g, '\n'));
	} else {
		message.channel.send(toSend);
	}
});

function readStorage() {
	try {
		const data = fs.readFileSync('./storage.json', 'utf8');
		storage = JSON.parse(data);
	} catch (err) {
		console.log(`Error reading file from disk: ${err}`);
	}
}

function parseMessage(command, args, author) {
	switch (command) {
		case 'hi':
			return 'Hi '+`${author}`;

		case 'help':
			return '`list`: List all unavailable resources\n`list-available`: List all resources which are currently available\n`list-all`: List all resources\n`add`: Add a resource with name <name>\n`remove`|`delete`: Remove the resource with name <name>\n`claim`: Claim resource with name <name>\n`claim-all`: Claim all resources\n`release`|`unclaim`: Release your claim on resource with name <name>\n`release-all`|`unclaim-all`: Release your claim on all resources';
		
		case 'list':		
			readStorage();
			sendmsg = [];
			storage.forEach(m => {
				if (m.available == false) {
					sendmsg.push(m.name+' :x: ('+m.claimedby+')');
				}
			});

			if (sendmsg.length == 0) {
				sendmsg.push("Nothing is claimed right now");
			}

			sendmsg = sendmsg.toString().replace(/,/g, '\n');
			return sendmsg;

		// List all resources
		case 'list-all':		
			readStorage();
			sendmsg = [];
			storage.forEach(m => {
				if (m.available == true) {
					sendmsg.push(m.name+' :white_check_mark:')
				} else if (m.available == false) {
					sendmsg.push(m.name+' :x: ('+m.claimedby+')');
				} else {
					sendmsg.push(m.name);
				}
			});
			sendmsg = sendmsg.toString().replace(/,/g, '\n');;
			return sendmsg;

		// List all resources which are currently available                      
		case 'list-available':	
			readStorage();
			sendmsg = [];
			storage.forEach(m => {
				if (m.available == true) {
					sendmsg.push(m.name+' :white_check_mark:')
				}
			});
			sendmsg = sendmsg.toString().replace(/,/g, '\n');
			return sendmsg;

		// Add a resource with name <name>
		case 'add': 
			if (!args.length) {
				return `You didn't provide any arguments ${author}!`;
			}

			readStorage();
			var cantadd
			storage.forEach(m => {if (m.name == args[0]) {cantadd = true;}});
			if (cantadd) { 
				return 'Resource `'+args[0]+'` already exists';
			}

			resourceobj = {};
			resourceobj.name = args[0];
			resourceobj.available = true;
			storage.push(resourceobj)
			
			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'Resource `'+args[0]+'` was added successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;

		// Remove the resource with name <name>
		case 'remove': case 'delete': 
			if (!args.length) {
				return `You didn't provide any arguments ${author}!`;
			}

			readStorage();
			remainingArr = storage.filter(data => data.name != args[0]);
			storage = remainingArr;

			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'Resource `'+args[0]+'` was deleted successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;

		// Claim resource with name <name>
		case 'claim': 
			if (!args.length) {
				return `You didn't provide any arguments ${author}!`;
			}

			readStorage();
			var elementPos = storage.map(function(x) {return x.name; }).indexOf(args[0]);
			var objectFound = storage[elementPos];	

			if (!objectFound) {
				return "Resource `"+args[0]+"` doesn't exist";
			}

			if (objectFound.available == false && args[1] != "--force") {
				return `${author}`+", you can't claim `"+args[0]+"` as it is claimed by "+objectFound.claimedby;
			}
			
			objectFound.available = false;	
			objectFound.claimedby = `${author.username}`;
			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'Resource `'+args[0]+'` was claimed successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;		

		// Claim all resources
		case 'claim-all': 
			readStorage();
			
			canClaimAll = true;
			storage.forEach(m => {
				if (m.available == false && args[1] != "--force") {
					canClaimAll = false;
				}
			});
			
			if (!canClaimAll) {
				return `${author}`+" you can't claim all resources as some are already claimed. Use `bot list` to see which ones or use `--force`";
			}

			storage.forEach(n => {
				n.available = false;
				n.claimedby = `${author.username}`;
			});

			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'All resources claimed successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;		

		// Release your claim on resource with name <name>
		case 'unclaim': case 'release':      
			if (!args.length) {
				return `You didn't provide any arguments ${author}!`;
			}	

			readStorage();
			var elementPos = storage.map(function(x) {return x.name; }).indexOf(args[0]);
			var objectFound = storage[elementPos];	
			
			if (!objectFound) {
				return "Resource `"+args[0]+"` doesn't exist";
			}

			if (objectFound.available == true) {
				return 'Resource `'+args[0]+'` is already unclaimed';
			}

			if (objectFound.claimedby != author.username && args[1] != "--force") {
				return `${author}`+" you can't unclaim `"+args[0]+"` as it was claimed by "+objectFound.claimedby;
			}

			objectFound.available = true;
			objectFound.claimedby = "";

			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'Resource `'+args[0]+'` was unclaimed successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;
		
		// Unclaim all resources
		case 'unclaim-all': case 'release-all':      
			readStorage();
			
			canUnclaimAll = true;
			storage.forEach(m => {
				if (m.claimedby != author.username && args[1] != "--force") {
					canUnclaimAll = false;
				}
			});
			
			if (!canUnclaimAll) {
				return `${author}`+" you can't unclaim all resources as some are already claimed. Use `bot list` to see which ones or use `--force`";
			}

			storage.forEach(n => {
				n.available = true;
				n.claimedby = "";
			});

			try {
				const data = JSON.stringify(storage, null, 4);
				fs.writeFileSync('./storage.json', data, 'utf8');
				return 'All resources unclaimed successfully by '+`${author}`;
			} catch (err) {
				console.log(`Error writing file: ${err}`);
			}
			break;
		case 'morelli_kicks_ass':  
			process.exit();
		default:
			return 'Command `'+command+'` is not known';
	}
}