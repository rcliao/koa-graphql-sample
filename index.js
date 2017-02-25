const { graphql, buildSchema } = require('graphql');
const koa = require('koa');
const mount = require('koa-mount');
const graphHttp = require('koa-graphql');

const schema = buildSchema(`
	type RandomDice {
		numSides: Int!
		rollOnce: Int!
		roll(numRolls: Int!): [Int]
	}
	input MessageInput {
		content: String
		author: String
	}
	type Message {
		id: ID!
		content: String
		author: String
	}

	type Mutation {
		createMessage(input: MessageInput): Message
		updateMessage(id: ID!, input: MessageInput): Message
	}
	type Query {
		hello: String
		quoteOfTheDay: String
		random: Float!
		rollThreeDice: [Int]
		rollDice(numDices: Int!, numSides: Int): [Int]
		getDice(numSides: Int): RandomDice
		getMessage(id: ID!): Message
	}
`);

class RandomDice {
	constructor (numSides) {
		this.numSides = numSides;
	}

	rollOnce () {
		return 1 + Math.floor(Math.random() * this.numSides);
	}

	roll ({numRolls}) {
		let output = [];
		for (let i = 0; i < numRolls; i++) {
			output.push(this.rollOnce());
		}
		return output;
	}
}

class Message {
	constructor (id, {content, author}) {
		this.id = id;
		this.content = content;
		this.author = author;
	}
}

const mockDatabase = {};

const root = {
	hello: () => 'Hello World!',
	quoteOfTheDay: () => {
		return Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within';
	},
	random: () => {
		return Math.random()
	},
	rollThreeDice: () => {
		return [1, 2, 3].map(_ => 1 + Math.floor(Math.random() * 6));
	},
	rollDice: ({numDices, numSides}) => {
		let output = [];
		for (var i = 0; i < numDices; i ++) {
			output.push(1 + Math.floor(Math.random() * (numSides || 6)));
		}
		return output;
	},
	getDice: ({numSides}) => {
		return new RandomDice(numSides || 6);
	},
	createMessage: ({input}) => {
		let id = require('crypto').randomBytes(10).toString('hex');
		mockDatabase[id] = input;
		return new Message(id, input);
	},
	updateMessage: ({id, input}) => {
		if (!mockDatabase[id]) {
			throw new Error('No message is found with id ' + id);
		}
		mockDatabase[id] = input;
		return new Message(id, input);
	},
	getMessage: ({id}) => {
		if (!mockDatabase[id]) {
			throw new Error('No message is found with id ' + id);
		}
		return new Message(id, mockDatabase[id]);
	}
};

const app = koa();

// x-response time
app.use(function *(next) {
	let start = new Date();
	yield next;
	let ms = new Date() - start;
	this.set('X-Response-Time', ms + 'ms');
});
// logger
app.use(function *(next) {
	let start = new Date();
	yield next;
	let ms = new Date() - start;
	console.log('%s %s - %s', this.method, this.url, ms);
});

app.use(mount('/graphql', graphHttp({
	schema: schema,
	graphiql: true,
	rootValue: root
})));

app.listen(3000);
console.log('Running GraphQL API server at localhost:3000/graphql');
