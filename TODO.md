# WishListCard Price Formatting Fixes

## Issues to Fix:

- [ ] Remove "$" prefix from price display and use proper VND formatting
- [ ] Fix compareAtPrice formatting (same issue)
- [ ] Format discount badge to show proper savings amount with currency
- [ ] Remove extra space in discount badge className
- [ ] Ensure proper conditional rendering when no discount exists
- [ ] Test formatting for both discounted and non-discounted items

## Implementation Steps:

1. Update price display: `${item.price.toLocaleString("vi-VN")}đ` → `{item.price.toLocaleString("vi-VN")}đ`
2. Update compareAtPrice display: Same formatting fix
3. Update discount badge: Show formatted savings amount
4. Remove leading space in badge className
5. Verify conditional rendering logic
