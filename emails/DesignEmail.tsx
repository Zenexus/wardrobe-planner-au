import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface ProductItem {
  itemNumber: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

interface DesignEmailProps {
  url?: string;
  showImage?: boolean;
  products?: ProductItem[];
  organizers?: ProductItem[];
  totalPrice?: number;
  totalItems?: number;
  totalQuantity?: number;
  designCode?: string;
  customerName?: string;
  bunningsCheckoutUrl?: string;
  bunningsTradeCheckoutUrl?: string;
}

export const DesignEmail = ({
  url = "https://wardrobe-planner.flexistorage.com.au/", // eslint-disable-line @typescript-eslint/no-unused-vars
  showImage = false,
  products = [],
  organizers = [],
  totalPrice = 0,
  totalItems = 0,
  totalQuantity = 0,
  designCode = "",
  customerName = "",
  bunningsCheckoutUrl = "",
  bunningsTradeCheckoutUrl = "",
}: DesignEmailProps) => {
  const hasProducts = products.length > 0 || organizers.length > 0;

  return (
    <Html>
      <Head />
      <Preview>
        {customerName
          ? `${customerName}, your Flexi Wardrobe Design is Ready!`
          : "Your Flexi Wardrobe Design is Ready!"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={h1}>
            {customerName
              ? `Thank You, ${customerName}!`
              : "Your Flexi Wardrobe Design"}
          </Heading>
          <Text style={subtitle}>Your wardrobe plan is ready to review</Text>

          <Hr style={divider} />

          {/* Screenshot Section */}
          {showImage && (
            <Section style={imageSection}>
              <Img
                src="cid:design-screenshot"
                alt="Design screenshot"
                style={image}
              />
            </Section>
          )}

          {/* Design Code Section */}
          {designCode && (
            <Section style={designCodeSection}>
              <Text style={designCodeLabel}>Your Design Code:</Text>
              <Text style={designCodeValue}>{designCode}</Text>
              <Text style={designCodeDescription}>
                Use this code to retrieve your design later or share it with our
                team.
              </Text>
            </Section>
          )}

          {/* Product List */}
          {hasProducts && (
            <>
              <Section style={productListSection}>
                <Heading style={h2}>Shopping List</Heading>

                {/* Main Products */}
                {products.length > 0
                  ? products.map((product, index) => (
                      <Section key={index} style={productCard}>
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              {/* Product Image */}
                              {product.image && (
                                <td
                                  style={{
                                    width: "80px",
                                    verticalAlign: "top",
                                    paddingRight: "12px",
                                  }}
                                >
                                  <Img
                                    src={product.image}
                                    alt={product.name}
                                    style={productImage}
                                  />
                                </td>
                              )}

                              {/* Product Details */}
                              <td
                                style={{
                                  verticalAlign: "top",
                                  paddingRight: "12px",
                                }}
                              >
                                <Text style={productName}>{product.name}</Text>
                                <Text style={productItemNumber}>
                                  #{product.itemNumber}
                                </Text>
                                {product.dimensions && (
                                  <Text style={productDimensions}>
                                    Dimensions: {product.dimensions.width} ×{" "}
                                    {product.dimensions.depth} ×{" "}
                                    {product.dimensions.height} cm
                                  </Text>
                                )}
                              </td>

                              {/* Price and Quantity */}
                              <td
                                style={{
                                  width: "120px",
                                  textAlign: "right",
                                  verticalAlign: "top",
                                }}
                              >
                                <Text style={productPrice}>
                                  ${Math.floor(product.totalPrice)}
                                  <span style={priceCents}>
                                    .
                                    {(product.totalPrice % 1)
                                      .toFixed(2)
                                      .substring(2)}
                                  </span>
                                </Text>
                                <Text style={productQuantity}>
                                  Qty: {product.quantity}
                                </Text>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    ))
                  : null}

                {/* Organizers */}
                {organizers.length > 0 && (
                  <>
                    <Hr style={sectionDivider} />
                    <Text style={sectionTitle}>Add-on Organisers</Text>
                    {organizers.map((organizer, index) => (
                      <Section key={index} style={productCard}>
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              {/* Organizer Image */}
                              {organizer.image && (
                                <td
                                  style={{
                                    width: "80px",
                                    verticalAlign: "top",
                                    paddingRight: "12px",
                                  }}
                                >
                                  <Img
                                    src={organizer.image}
                                    alt={organizer.name}
                                    style={productImage}
                                  />
                                </td>
                              )}

                              {/* Organizer Details */}
                              <td
                                style={{
                                  verticalAlign: "top",
                                  paddingRight: "12px",
                                }}
                              >
                                <Text style={productName}>
                                  {organizer.name}
                                </Text>
                                <Text style={productItemNumber}>
                                  #{organizer.itemNumber}
                                </Text>
                                {organizer.dimensions && (
                                  <Text style={productDimensions}>
                                    Dimensions: {organizer.dimensions.width} ×{" "}
                                    {organizer.dimensions.depth} ×{" "}
                                    {organizer.dimensions.height} cm
                                  </Text>
                                )}
                              </td>

                              {/* Price and Quantity */}
                              <td
                                style={{
                                  width: "120px",
                                  textAlign: "right",
                                  verticalAlign: "top",
                                }}
                              >
                                <Text style={productPrice}>
                                  ${Math.floor(organizer.totalPrice)}
                                  <span style={priceCents}>
                                    .
                                    {(organizer.totalPrice % 1)
                                      .toFixed(2)
                                      .substring(2)}
                                  </span>
                                </Text>
                                <Text style={productQuantity}>
                                  Qty: {organizer.quantity}
                                </Text>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    ))}
                  </>
                )}

                {/* Total Section */}
                <Hr style={totalDivider} />
                <Section style={totalSection}>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td>
                          <Text style={totalLabel}>
                            Total ({totalItems} unique items, {totalQuantity}{" "}
                            total)
                          </Text>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Text style={totalPriceText}>
                            ${Math.floor(totalPrice)}
                            <span style={totalPriceCents}>
                              .{(totalPrice % 1).toFixed(2).substring(2)}
                            </span>
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>
              </Section>
            </>
          )}

          {/* Bunnings Checkout Section */}
          {(bunningsCheckoutUrl || bunningsTradeCheckoutUrl) && (
            <Section style={bunningsSection}>
              <Heading style={h3}>
                Order these products with the Bunnings website
              </Heading>

              {bunningsCheckoutUrl && (
                <>
                  <Text style={bunningsText}>
                    Or place an order at your local Bunnings at the Customer
                    Special Order desk. Stock availability depends on store or
                    location.
                  </Text>
                  <Section style={buttonContainer}>
                    <Button style={bunningsButton} href={bunningsCheckoutUrl}>
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "center" }}>
                              <span
                                style={{ color: "#ffffff", marginRight: "8px" }}
                              >
                                Checkout at
                              </span>
                              <span style={{ color: "#ffffff" }}>Bunnings</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Button>
                  </Section>
                </>
              )}

              {bunningsTradeCheckoutUrl && (
                <>
                  <Text style={bunningsText}>
                    PowerPass account required to checkout at Bunnings Trade.
                    PowerPass pricing will be visible once logged in.
                  </Text>
                  <Section style={buttonContainer}>
                    <Button
                      style={bunningsTradeButton}
                      href={bunningsTradeCheckoutUrl}
                    >
                      <table style={{ width: "100%" }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "center" }}>
                              <span
                                style={{ color: "#1a1a1a", marginRight: "8px" }}
                              >
                                Checkout at
                              </span>
                              <span style={{ color: "#1a1a1a" }}>
                                Bunnings Trade
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Button>
                  </Section>
                </>
              )}
            </Section>
          )}

          {/* Help Section */}
          <Section style={helpSection}>
            <Heading style={h3}>Need help? We&apos;re right here.</Heading>
            <Text style={helpText}>
              Whether you&apos;ve a question or would like us to review your
              design before you buy, we&apos;d love to help.
            </Text>
            <Text style={helpText}>
              <a href="https://flexistorage.com.au/contact-us/" style={link}>
                Contact us
              </a>
            </Text>
          </Section>

          <Hr style={footerDivider} />

          {/* Disclaimer Section */}
          <Section style={disclaimerSection}>
            <Text style={disclaimerText}>
              * While we endeavour to provide accurate and up to date
              information, prices and availability may vary by store. Please
              check in-store at Bunnings or online at bunnings.com.au for prices
              and availability. Please note, products and sizes may not be
              available at all Bunnings stores. We recommend customers contact
              their local Bunnings store first and foremost for availability to
              avoid disappointment. For more information on our Rack It range,
              please consult a team member at your local Bunnings Warehouse.
            </Text>
            <Text style={disclaimerText}>
              * We have tried to be very specific with the dimensions here.
              However, please note that manufacturing tolerances may lead to
              slight variations to the system size and individual product
              dimensions shown above. This will not affect the function or
              quality of the product but may lead to slight differences between
              the Planner and the actual build dimensions.
            </Text>
            <Text style={disclaimerText}>
              * By providing your postcode here, you help us to better allocate
              stock throughout our network.
            </Text>
            <Text style={disclaimerText}>
              * All freestanding units 500mm or greater in height should be
              anchored to the ground, wall or other suitable surface to avoid
              serious injury or death. To help avoid any serious injury or
              death, these products have been ﬁtted with a ground mounting
              bracket to prevent toppling. We strongly recommend that these
              products be permanently fixed to the ground or wall. Fixing
              devices are not included since different surface materials require
              different attachments. Please seek professional advice if you are
              in doubt as to which fixing device to use. Regularly check your
              fixing device.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for choosing Flexi Wardrobe Builder
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DesignEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "20px",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "10px",
  marginTop: "0",
  textAlign: "center" as const,
};

const subtitle = {
  color: "#666",
  fontSize: "16px",
  marginTop: "0",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const divider = {
  borderColor: "#007bff",
  borderWidth: "2px",
  margin: "30px auto",
  width: "60px",
};

const imageSection = {
  marginTop: "30px",
  marginBottom: "30px",
  textAlign: "center" as const,
};

const image = {
  maxWidth: "100%",
  height: "auto",
  borderRadius: "4px",
  border: "1px solid #e6ebf1",
};

const designCodeSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "6px",
  marginTop: "20px",
  marginBottom: "30px",
  textAlign: "center" as const,
};

const designCodeLabel = {
  color: "#666",
  fontSize: "14px",
  marginBottom: "8px",
  marginTop: "0",
};

const designCodeValue = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  fontFamily: "monospace",
  marginTop: "0",
  marginBottom: "8px",
};

const designCodeDescription = {
  color: "#666",
  fontSize: "12px",
  marginTop: "0",
  marginBottom: "0",
};

const productListSection = {
  marginTop: "30px",
  marginBottom: "30px",
};

const h2 = {
  color: "#333",
  fontSize: "22px",
  fontWeight: "bold",
  marginBottom: "20px",
  marginTop: "0",
};

const h3 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "12px",
  marginTop: "0",
};

const sectionDivider = {
  borderColor: "#e6ebf1",
  borderWidth: "1px",
  marginTop: "30px",
  marginBottom: "20px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "0",
  marginBottom: "15px",
};

const productCard = {
  backgroundColor: "#ffffff",
  padding: "16px",
  borderRadius: "4px",
  marginBottom: "12px",
  border: "1px solid #e6ebf1",
};

const productImage = {
  width: "64px",
  height: "64px",
  objectFit: "cover" as const,
  borderRadius: "4px",
  border: "1px solid #e6ebf1",
};

const productName = {
  color: "#333",
  fontSize: "15px",
  fontWeight: "600",
  marginTop: "0",
  marginBottom: "4px",
  lineHeight: "1.4",
};

const productItemNumber = {
  color: "#666",
  fontSize: "13px",
  marginTop: "0",
  marginBottom: "6px",
  lineHeight: "1.4",
};

const productDimensions = {
  color: "#666",
  fontSize: "12px",
  marginTop: "0",
  marginBottom: "0",
  lineHeight: "1.4",
};

const productPrice = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "0",
  marginBottom: "4px",
  lineHeight: "1.4",
};

const priceCents = {
  fontSize: "14px",
};

const productQuantity = {
  color: "#666",
  fontSize: "13px",
  marginTop: "0",
  marginBottom: "0",
  lineHeight: "1.4",
};

const totalDivider = {
  borderColor: "#333",
  borderWidth: "2px",
  marginTop: "30px",
  marginBottom: "20px",
};

const totalSection = {
  padding: "16px 0",
  marginBottom: "30px",
};

const totalLabel = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  marginTop: "0",
  marginBottom: "0",
};

const totalPriceText = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "0",
  marginBottom: "0",
};

const totalPriceCents = {
  fontSize: "20px",
};

const bunningsSection = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "6px",
  marginTop: "30px",
  marginBottom: "30px",
};

const bunningsText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "0",
  marginBottom: "16px",
};

const bunningsButton = {
  backgroundColor: "#DA291C",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  width: "100%",
  maxWidth: "320px",
};

const bunningsTradeButton = {
  backgroundColor: "#FFAB00",
  borderRadius: "6px",
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  width: "100%",
  maxWidth: "320px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "16px",
  marginBottom: "16px",
};

const helpSection = {
  backgroundColor: "#e3f2fd",
  padding: "20px",
  borderRadius: "6px",
  marginTop: "30px",
  marginBottom: "30px",
};

const helpText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "0",
  marginBottom: "12px",
};

const link = {
  color: "#007bff",
  textDecoration: "underline",
};

const footerDivider = {
  borderColor: "#e6ebf1",
  borderWidth: "1px",
  marginTop: "30px",
  marginBottom: "30px",
};

const disclaimerSection = {
  marginBottom: "30px",
};

const disclaimerText = {
  color: "#999",
  fontSize: "11px",
  lineHeight: "1.6",
  marginTop: "0",
  marginBottom: "12px",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "30px",
};

const footerText = {
  color: "#999",
  fontSize: "13px",
  marginTop: "0",
  marginBottom: "0",
};
