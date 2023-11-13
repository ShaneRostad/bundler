class BundleBuilder extends HTMLElement {
  constructor() {
    super();

    this.cart =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    this.step = 1;
    this.activeBundleCount = 5;
    this.bundleOptions = this.querySelectorAll(".bundle-option");
    this.step1 = this.querySelector(".js-step-1");
    this.step2 = this.querySelector(".js-step-2");
    this.selectedColorsContainer = this.querySelector(
      ".js-selected-bundle-options"
    );
    this.selectedColorsHeader = this.querySelector(
      ".js-selected-bundle-options_header"
    );
    this.selectedColors = [];

    this.bundleOptions.forEach((bundle) => {
      bundle.addEventListener("click", (event) => {
        this.setActiveBundle(event.currentTarget.dataset.idx);
      });
    });

    this.querySelector(".js-add-bundle-to-cart").addEventListener(
      "click",
      () => {
        this.addBundleToCart();
        this.setStep(1);
      }
    );

    this.querySelectorAll(".animal-option").forEach((el) => {
      el.addEventListener("click", (event) => {
        console.log(event.currentTarget.dataset);
        this.addColor(event.currentTarget.dataset);
      });
    });

    this.querySelector(".js-next-step").addEventListener("click", (event) => {
      this.setStep(2);
    });
    this.querySelector(".js-back-step").addEventListener("click", (event) => {
      this.setStep(1);
    });
  }

  setStep(step) {
    if (this.step === step) return;
    if (step === 1) {
      document.querySelector(".variant-title").style.display = "block";
      document.querySelector(".variant-options").style.display = "flex";
      this.step1.classList.remove("hidden");
      this.step2.classList.add("hidden");
      this.selectedColors = [];
      this.bundleIncomplete();
    } else if (step === 2) {
      document.querySelector(".variant-title").style.display = "none";
      document.querySelector(".variant-options").style.display = "none";
      this.step1.classList.add("hidden");
      this.step2.classList.remove("hidden");
      this.buildSelectedColors();
    }
    this.step = step;
  }

  setActiveBundle(idx) {
    this.bundleOptions.forEach((el) => {
      el.classList.remove("active");
    });
    this.bundleOptions[idx].classList.add("active");
    this.activeBundleCount = Number(this.bundleOptions[idx].dataset.bundleSize);
  }

  buildSelectedColors() {
    this.selectedColorsHeader.innerHTML = "";
    this.selectedColorsContainer.innerHTML = "";
    for (let i = 0; i < this.activeBundleCount; i++) {
      this.selectedColorsContainer.insertAdjacentHTML(
        "beforeend",
        `${
          this.selectedColors[i]
            ? `<div class="selected-color selected"><button data-idx=${i} class="js-remove-color bundle-remove-color">X</button><div class="selected-color_img"><img src=${this.selectedColors[i].imgSrc}/></div><div>${this.selectedColors[i].title}</div></div>`
            : `<div class="selected-color"><div class="selected-color_img"><div></div></div><div>Animal #${
                i + 1
              }</div></div>`
        }`
      );
    }

    // add event listeners to remove color
    this.querySelectorAll(".js-remove-color").forEach((el) => {
      el.addEventListener("click", (event) => {
        this.selectedColors.splice(event.currentTarget.dataset.idx, 1);
        this.bundleIncomplete();
        this.buildSelectedColors();
      });
    });

    let fullPrice = 0;
    if (this.activeBundleCount === 5) {
      fullPrice = "$100";
    } else if (this.activeBundleCount === 3) {
      fullPrice = "$83.97";
    } else if (this.activeBundleCount === 2) {
      fullPrice = "$63.98";
    } else if (this.activeBundleCount === 1) {
      fullPrice = "$39.99";
    }

    this.selectedColorsHeader.innerHTML = `
      <div>
        Step 2: Choose Your Animals
      </div>
      <div class="bundle-header-prices">
        ${
          this.activeBundleCount === 1
            ? `<div class="bundle-option_real-price">$39.99</div>`
            : `
                <div class="bundle-option_compare-price">$${Math.floor(
                  39.99 * this.activeBundleCount
                )}</div>
                <div class="bundle-option_real-price">${
                  this.activeBundleCount === 1 ? "" : fullPrice
                }</div>
              `
        }
      </div>`;
  }

  bundleComplete() {
    this.querySelector(".animal-options").style.display = "none";
    this.querySelector(".selected-bundle-options-container").classList.add(
      "bundle-finished"
    );
    this.querySelector(".bundle-buttons-container").classList.add(
      "bundle-finished"
    );
    this.querySelector(".js-add-bundle-to-cart").disabled = false;
  }

  bundleIncomplete() {
    this.querySelector(".animal-options").style.display = "flex";
    this.querySelector(".selected-bundle-options-container").classList.remove(
      "bundle-finished"
    );
    this.querySelector(".bundle-buttons-container").classList.remove(
      "bundle-finished"
    );
    this.querySelector(".js-add-bundle-to-cart").disabled = true;
  }

  addBundleToCart() {
    let sectionsToBundle = ["variant-added"];
    document.documentElement.dispatchEvent(
      new CustomEvent("cart:prepare-bundled-sections", {
        bubbles: true,
        detail: { sections: sectionsToBundle },
      })
    );

    let variantQuantities = {};

    this.selectedColors.forEach(({ id }) => {
      variantQuantities[id] = variantQuantities[id]
        ? variantQuantities[id] + 1
        : 1;
    });

    let formItems = Object.keys(variantQuantities).map((variantId) => {
      return {
        id: variantId,
        quantity: variantQuantities[variantId],
      };
    });

    let formData = {
      items: formItems,
      sections: sectionsToBundle.join(","),
      sections_url: window.location.pathname,
    };

    fetch(window.Shopify.routes.root + "cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((response) => {
        this.renderContents(response);
        if (response.ok) {
        } else {
          this.dispatchEvent(
            new CustomEvent("cart:error", {
              bubbles: true,
              detail: {
                error: response["description"],
              },
            })
          );
        }
      });
  }

  async renderContents(response) {
    console.log(response);
    const cartContent = await (
      await fetch(`${Shopify.routes.root}cart.js`)
    ).json();

    console.log(response);
    console.log(cartContent);
    cartContent["sections"] = response["sections"];
    this.dispatchEvent(
      new CustomEvent("variant:add", {
        bubbles: true,
        detail: {
          items: response.hasOwnProperty("items")
            ? response["items"]
            : [response],
          cart: cartContent,
        },
      })
    );
    document.documentElement.dispatchEvent(
      new CustomEvent("cart:change", {
        bubbles: true,
        detail: {
          baseEvent: "variant:add",
          cart: cartContent,
        },
      })
    );
  }

  addColor({ title, imgsrc, id }) {
    if (this.selectedColors.length === this.activeBundleCount) {
      return;
    }

    this.selectedColors.push({ title: title, imgSrc: imgsrc, id: id });
    if (this.selectedColors.length === this.activeBundleCount) {
      this.bundleComplete();
    } else {
      this.bundleIncomplete();
    }
    this.buildSelectedColors();
  }
}

customElements.define("bundle-builder", BundleBuilder);
