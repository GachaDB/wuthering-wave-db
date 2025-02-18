async function fetchCoupons() {
    try {
        const response = await fetch("../Asset/json/code.json");
        if (!response.ok) throw new Error("Failed to fetch JSON");

        const coupons = await response.json();

        if (!Array.isArray(coupons)) {
            throw new Error("JSON is not an array");
        }

        displayCoupons(coupons);
    } catch (error) {
        console.error("Error loading coupons:", error);
    }
}

function displayCoupons(coupons) {
    const activeList = document.getElementById("activeCoupons");
    const expiredList = document.getElementById("expiredCoupons");

    activeList.innerHTML = "";
    expiredList.innerHTML = "";

    const today = new Date();
    const unknownDate = "2100-01-01";

    coupons.forEach(coupon => {
        const isUnknown = coupon.expires === unknownDate;
        let statusClass = "valid";
        let displayText = isUnknown ? "Unknown Expiration" : "";

        if (!isUnknown) {
            const expireDate = new Date(coupon.expires);
            let diffDays = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                statusClass = "expired";
                displayText = `(Expired ${Math.abs(diffDays)} days ago)`;
            } else if (diffDays <= 3) {
                statusClass = "warning";
                displayText = `(Expires in ${diffDays} days)`;
            } else {
                displayText = `(Expires in ${diffDays} days)`;
            }
        }

        const couponDiv = document.createElement("div");
        couponDiv.className = `coupon ${statusClass}`;
        couponDiv.innerText = `${coupon.code} ${displayText}`;

        if (!isUnknown && new Date(coupon.expires) < today) {
            expiredList.appendChild(couponDiv);
        } else {
            activeList.appendChild(couponDiv);
        }
    });
}

fetchCoupons();
