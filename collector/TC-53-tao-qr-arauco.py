import os
import cv2
import cv2.aruco as aruco

# TC-53: tao QR code va ArUco marker cho 3 laptop node trong testbed
OUTPUT_DIR = "markers"
NODE_IDS = ["NODE-01", "NODE-02", "NODE-03", "NODE-04"]
ARUCO_DICT = aruco.DICT_4X4_50
QR_SCALE = 10
ARUCO_SIZE = 400


def generate_qr_codes(node_ids, output_dir):
    encoder = cv2.QRCodeEncoder_create()
    contents = {}

    for node_id in node_ids:
        content = f"arimms://node/{node_id}"
        contents[node_id] = content

        qr_matrix = encoder.encode(content)  # tra ve anh 0/255, khong can nhan them
        h, w = qr_matrix.shape
        qr_image = cv2.resize(qr_matrix, (w * QR_SCALE, h * QR_SCALE), interpolation=cv2.INTER_NEAREST)

        filepath = os.path.join(output_dir, f"qr_{node_id}.png")
        cv2.imwrite(filepath, qr_image)
        print(f"[OK] QR {node_id} -> {filepath}")

    return contents


def generate_aruco_markers(node_ids, output_dir):
    aruco_dict = aruco.getPredefinedDictionary(ARUCO_DICT)
    marker_ids = {}

    for i, node_id in enumerate(node_ids, start=1):
        marker_ids[node_id] = i
        marker_img = aruco.generateImageMarker(aruco_dict, i, ARUCO_SIZE)

        filepath = os.path.join(output_dir, f"aruco_{i}_{node_id}.png")
        cv2.imwrite(filepath, marker_img)
        print(f"[OK] ArUco id={i} cho {node_id} -> {filepath}")

    return marker_ids


def write_mapping_table(node_ids, qr_contents, aruco_ids, output_dir):
    filepath = os.path.join(output_dir, "mapping_table.csv")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("node_id,qr_content,aruco_id,qr_file,aruco_file\n")
        for node_id in node_ids:
            qr_file = f"qr_{node_id}.png"
            aruco_file = f"aruco_{aruco_ids[node_id]}_{node_id}.png"
            f.write(f"{node_id},{qr_contents[node_id]},{aruco_ids[node_id]},{qr_file},{aruco_file}\n")

    print(f"[OK] Mapping table -> {filepath}")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    qr_contents = generate_qr_codes(NODE_IDS, OUTPUT_DIR)
    aruco_ids = generate_aruco_markers(NODE_IDS, OUTPUT_DIR)
    write_mapping_table(NODE_IDS, qr_contents, aruco_ids, OUTPUT_DIR)

    print(f"Xong. {len(NODE_IDS)} node, {len(NODE_IDS) * 2} anh trong '{OUTPUT_DIR}/'.")


if __name__ == "__main__":
    main()
