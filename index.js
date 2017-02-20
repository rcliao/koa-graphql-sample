const { graphql, buildSchema } = require('graphql');
const koa = require('koa');

const schema = buildSchema(`
	type Query {
		hello: String
	}
`);

const root = { hello: () => 'Hello World!' };

graphql(schema, '{ hello }', root)
	.then(response => {
		console.log(response);
	});
	
const app = koa();

app.use(function *(next) {
	let start = new Date();
	yield next;
	let ms = new Date() - start;
	this.set('X-Response-Time', ms + 'ms');
});

app.use(function *() {
	this.body = 'Hello world!';
});

app.listen(3000);
