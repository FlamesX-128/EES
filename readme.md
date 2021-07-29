# **EES (Embedded ECMAScript templating);**
You can use javascript templates in the html.

### **Syntax**:
`<()>` Start a new javascript template, always add the brackets "`{}`" at the end.
```jsx
<body>
  <(for (let i = 0; i < 2; i++) {
    <h1>Hello</h1>
  })>
</body>
```

```jsx
<body>
  <(if (2 > 1) {
    <h1>Two is greater than one!</h1>
  })>
</body>
```
---

`<{}>` Get a variable from store.

- `main` is equivalent to the module that contains the value.
- `potato` is equivalent to the variable to get.
- `main` and `potato` can alternate depending on your needs.

```jsx
  <body>
    <h1><{main:potato}></h1>
  </body>
```

```jsx
  <body>
    <(for (const user of <{main:users}>) {
      <h1>${user}</h1>
    })>
  </body>
```

---

`${}` Get a local variable.
```jsx
  <body>
    <(for (const element of ["a", "b", "c"]) {
      <div class="${element}">
        <h1>Hello world!</h1>
      </div>
    })>
  </body>
```

```jsx
  <body>
    <h1>Potato</h1>

    <(for (let i = 0; i < 2; i++) {
      <footer>Footer #${i}</footer>
    })>
  </body>
```

---

##### **`BETA (0.0.1)`**