# Outline (getoutline.com) Backup Tool

A way to automatically backup your outline knowledge base. Backups will be stored in ./backups.

# Setup

1. You need an admin account on your outline instance ([why?](https://github.com/outline/outline/discussions/3468))
2. Obtain an [API Key](https://www.getoutline.com/developers#section/Authentication) from your instance (http://outline.your.domain/settings/tokens) with scopes "collections.export collections.export_all fileOperations.redirect fileOperations.delete fileOperations.info"
3. Create .env file use [example.env](./example.env) as a starting point
4. Run it with node (> `node index.js`)
5. The backups will be exported and stored in ./backups

# Motivation

I like to have my data available, as plain text, when outline breaks for whatever reason (most likely due to user error). It never broke until now but better save than sorry (: