Quando fazemos upload de arquivos em uma aplicação backend não salvar no disco, mas para isso
seria necessário configurar algum serviso externo de upload de arquivos. Como: amazon s3; cloudflare r2;

Expless usa o multer para upload de arquivos e o fastify usa o fastify-multipart

Uma das coisas que o node ficou famoso é sua capacidade de stream (ler/escrever dados aos poucos)