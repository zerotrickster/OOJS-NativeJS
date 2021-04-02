const API =
  "https://raw.githubusercontent.com/zerotrickster/online-store-api/master/responses";

class List {
  constructor(url, container, list = list2) {
    this.container = container;
    this.list = list;
    this.url = url;
    this.goods = [];
    this.allProducts = [];
    this.filtered = [];
    this._init();
  }
  getJson(url) {
    return fetch(url ? url : `${API + this.url}`)
      .then((result) => result.json())
      .catch((error) => {
        console.log(error);
      });
  }
  handleData(data) {
    this.goods = [...data];
    this.render();
  }
  calcSum() {
    return this.allProducts.reduce((accum, item) => (accum += item.price), 0);
  }
  render() {
    const block = document.querySelector(this.container);
    for (let product of this.goods) {
      //console.log(this.constructor.name);
      const productObj = new this.list[this.constructor.name](product);
      //console.log(productObj);
      this.allProducts.push(productObj);
      block.insertAdjacentHTML("beforeend", productObj.render());
    }
  }
  filter(value) {
    const regexp = new RegExp(value, "i");
    this.filtered = this.allProducts.filter((product) =>
      regexp.test(product.product_name)
    );
    this.allProducts.forEach((el) => {
      const block = document.querySelector(
        `.product-item[data-id="${el.id_product}"]`
      );
      if (!this.filtered.includes(el)) {
        block.classList.add("invisible");
      } else {
        block.classList.remove("invisible");
      }
    });
  }
  _init() {
    return false;
  }
}

class Item {
  constructor(el) {
    this.product_name = el.product_name;
    this.price = el.price;
    this.id_product = el.id_product;
    this.img = el.img;
  }
  render() {
    //генерация товара для каталога товаров
    return `<div class="product-item" data-id="${this.id_product}">
                <img src="${this.img}" alt="product-photo" class="product-img" width="270" height="270">
                <h3>${this.product_name}</h3>
                <span>${this.price}</span>
                <button class="btn buy-btn"
                data-id="${this.id_product}"
                data-name="${this.product_name}"
                data-price="${this.price}"
                data-img="${this.img}">buy</button>
            </div>`;
  }
}

class ProductsList extends List {
  constructor(cart, container = ".products", url = "/catalogData.json") {
    super(url, container);
    this.cart = cart;
    this.getJson().then((data) => this.handleData(data)); //handleData запускает отрисовку либо каталога товаров, либо списка товаров корзины
  }
  _init() {
    document.querySelector(this.container).addEventListener("click", (e) => {
      if (e.target.classList.contains("buy-btn")) {
        //                console.log(e.target);
        this.cart.addProduct(e.target);
      }
    });
    document.querySelector(".search-field").addEventListener("input", (e) => {
      this.filter(e.target.value);
    });

    document.querySelector(".search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.filter(document.querySelector(".search-field").value);
    });
  }
}

class ProductItem extends Item {}

class Cart extends List {
  constructor(container = ".cart", url = "/getBasket.json") {
    super(url, container);
    this.getJson().then((data) => {
      this.handleData(data.contents); //вывели все товары в корзине
    });
  }
  addProduct(element) {
    this.getJson(`${API}/addToBasket.json`).then((data) => {
      if (data.result === 1) {
        let productId = +element.dataset["id"];
        let find = this.allProducts.find(
          (product) => product.id_product === productId
        );
        if (find) {
          find.quantity++;
          this._updateCart(find);
        } else {
          let product = {
            id_product: productId,
            price: +element.dataset["price"],
            product_name: element.dataset["name"],
            quantity: 1,
            img: element.dataset["img"],
          };
          this.goods = [product];
          this.render();
        }
      } else {
        alert("Error");
      }
    });
  }
  removeProduct(element) {
    this.getJson(`${API}/deleteFromBasket.json`).then((data) => {
      if (data.result === 1) {
        let productId = +element.dataset["id"];
        let find = this.allProducts.find(
          (product) => product.id_product === productId
        );

        this.allProducts.splice(this.allProducts.indexOf(find), 1);
        document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
      }
    });
  }
  minusProduct(element) {
    let productId = +element.dataset["id"];
    let find = this.allProducts.find(
      (product) => product.id_product === productId
    );
    if (find.quantity > 1) {
      find.quantity--;
      this._updateCart(find);
    } else {
      this.allProducts.splice(this.allProducts.indexOf(find), 1);
      document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
    }
  }
  plusProduct(element) {
    let productId = +element.dataset["id"];
    let find = this.allProducts.find(
      (product) => product.id_product === productId
    );
    find.quantity++;
    this._updateCart(find);
  }
  _updateCart(product) {
    let block = document.querySelector(
      `.cart-item[data-id="${product.id_product}"]`
    );
    block.querySelector(
      ".product-quantity"
    ).textContent = `Quantity: ${product.quantity}`;
    block.querySelector(".product-price").textContent = `Cost: $${
      product.quantity * product.price
    }`;
  }
  _init() {
    document.querySelector(".btn-cart").addEventListener("click", () => {
      document.querySelector(".cart-container").classList.add("open");
    });
    document.querySelector(".btn-back").addEventListener("click", () => {
      document.querySelector(".cart-container").classList.remove("open");
    });
    document.querySelector(this.container).addEventListener("click", (e) => {
      if (e.target.classList.contains("del-btn")) {
        this.removeProduct(e.target);
      }
    });
    document.querySelector(this.container).addEventListener("click", (e) => {
      if (e.target.classList.contains("minus-btn")) {
        this.minusProduct(e.target);
      }
    });
    document.querySelector(this.container).addEventListener("click", (e) => {
      if (e.target.classList.contains("plus-btn")) {
        this.plusProduct(e.target);
      }
    });
  }
}

class CartItem extends Item {
  constructor(el) {
    super(el);
    this.quantity = el.quantity;
  }
  render() {
    return `<div class="cart-item" data-id="${this.id_product}">
                <button class="del-btn" 
                data-id="${this.id_product}">&times;</button>
                <img src="${
                  this.img
                }" alt="product-photo" class="product-img" width="270" height="270">
                <h3 class="product-title">${this.product_name}</h3>
                <div class="product-single-price">$${this.price} each</div>
                <div class="product-quantity">Quantity: ${this.quantity}</div>
                <div class="product-price"> Cost: $${
                  this.quantity * this.price
                }</div>
                <div class="cart-item-footer">
                  <button class="btn plus-btn"
                  data-id="${this.id_product}">+</button>
                  <button class="btn minus-btn" data-id="${
                    this.id_product
                  }">-</button>
                </div>
                
                
            </div>`;
  }
}
const list2 = {
  ProductsList: ProductItem,
  Cart: CartItem,
};

let cart = new Cart();
let products = new ProductsList(cart);
