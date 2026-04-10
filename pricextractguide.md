in imgs/.jpg the prices visible are : 
3.30 (original price, strike through text)
2.86 (discounted price, in orange text)

in imgs/2.png the prices visible are : 
5.00 (original price, strike through text)
4.02 (discounted price, in orange text)

in imgs/3.png the prices visible are : 
30.00 (original price, strike through text)
and there is NO discounted price visible, no orange text.

you have to extract the prices from the images and return the discounted price if available, otherwise return the original price.

use the following logic to determine the discounted price:
1. look for orange text with a decimal number, this is the discounted price.
2. if no orange text is found, look for strike through text with a decimal number, this is the original price.
3. if both are found, return the discounted price.
4. if only one is found, return that price.
5. if neither is found, return 0.