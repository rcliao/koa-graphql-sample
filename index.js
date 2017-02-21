const { graphql, buildSchema } = require('graphql');
const koa = require('koa');
const mount = require('koa-mount');
const graphHttp = require('koa-graphql');

const schema = buildSchema(`
	type Query {
		hello: String
		quoteOfTheDay: String
		random: Float!
		rollThreeDice: [Int]
	}
`);

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
