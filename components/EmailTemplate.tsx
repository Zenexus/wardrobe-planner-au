import { Html, Button, Img } from "@react-email/components";

export function EmailTemplate(props: { url: string; showImageCid?: string }) {
  const { url, showImageCid } = props;

  return (
    <Html lang="en">
      <Button href={url}>View Design</Button>
      {showImageCid ? (
        <div style={{ marginTop: 16 }}>
          <Img src={`cid:${showImageCid}`} alt="Design screenshot" />
        </div>
      ) : null}
    </Html>
  );
}
