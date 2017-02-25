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
	type Query {
		hello: String
		quoteOfTheDay: String
		random: Float!
		rollThreeDice: [Int]
		rollDice(numDices: Int!, numSides: Int): [Int],
		getDice(numSides: Int): RandomDice
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
