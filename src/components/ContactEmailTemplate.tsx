import { Html, Head, Body, Container, Text, Hr } from "@react-email/components";

export function ContactEmailTemplate(props: {
  name: string;
  email: string;
  postcode?: string;
  subscribe: boolean;
}) {
  const { name, email, postcode, subscribe } = props;

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}
      >
        <Container
          style={{
            margin: "0 auto",
            padding: "20px 0 48px",
            maxWidth: "580px",
          }}
        >
          <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
            New Contact Form Submission
          </Text>

          <Hr style={{ borderColor: "#e6ebf1", margin: "20px 0" }} />

          <Text
            style={{ fontSize: "16px", color: "#333", marginBottom: "10px" }}
          >
            <strong>Name:</strong> {name}
          </Text>

          <Text
            style={{ fontSize: "16px", color: "#333", marginBottom: "10px" }}
          >
            <strong>Email:</strong> {email}
          </Text>

          {postcode && (
            <Text
              style={{ fontSize: "16px", color: "#333", marginBottom: "10px" }}
            >
              <strong>Postcode:</strong> {postcode}
            </Text>
          )}

          <Text
            style={{ fontSize: "16px", color: "#333", marginBottom: "10px" }}
          >
            <strong>Newsletter Subscription:</strong> {subscribe ? "Yes" : "No"}
          </Text>

          <Hr style={{ borderColor: "#e6ebf1", margin: "20px 0" }} />

          <Text style={{ fontSize: "14px", color: "#666" }}>
            This email was sent from the Flexi Wardrobe Builder contact form.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
