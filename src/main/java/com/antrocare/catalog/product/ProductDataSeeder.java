package com.antrocare.catalog.product;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ProductDataSeeder implements CommandLineRunner {

    private static final String DEFAULT_COST = "₹50";
    private static final int DEFAULT_STOCK = 50;

    private final ProductRepository productRepository;

    public ProductDataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            productRepository.findAll().forEach(product -> {
                product.resetForExistingCatalog(DEFAULT_COST, DEFAULT_STOCK);
                productRepository.save(product);
            });
            return;
        }

        Map<String, CategorySeed> catalog = new LinkedHashMap<>();
        catalog.put("Cervical Orthosis", new CategorySeed(2, List.of(
            "Philadelphia Collar",
            "Cervical Hard Collar (Adjustable)",
            "Cervical Soft Collar",
            "Cervical Traction Collar",
            "Cervical Pillow",
            "SOMI Brace",
            "Cervical Ortho Wedge (2.5, 3 inches etc.)"
        )));
        catalog.put("Elbow / Wrist Supports", new CategorySeed(2, List.of(
            "Neoprene Elbow Sleeve",
            "Elastic Elbow Sleeve",
            "Neoprene Tennis Elbow Strap",
            "Fore Arm Cock Up Splint",
            "Short Cock Up Splint",
            "Universal Neoprene Wrist Wrap",
            "Dynamic Cock Up Splint",
            "Dynamic Cock Up Finger Extension Splint",
            "Static Cock Up Splint",
            "Thumb Spica Splint",
            "Hand ROM Brace",
            "Carpal Tunnel Splint"
        )));
        catalog.put("Shoulder Orthosis", new CategorySeed(3, List.of(
            "Arm Sling",
            "Shoulder Immobilizer with Sling",
            "Arm Immobilizer",
            "Shoulder Immobilizer",
            "Shoulder Abduction Pillow",
            "Shoulder Dislocation Support",
            "Shoulder Abduction Splint / Airplane Splint",
            "Humeral Fracture Brace",
            "Clavicle Brace",
            "PP Humeral Fracture Brace"
        )));
        catalog.put("Hip Orthosis", new CategorySeed(4, List.of(
            "Femur Brace",
            "Hip Orthosis",
            "Hip Abduction Pillow",
            "Hip Lower Extremity Orthosis (Child/Adult)"
        )));
        catalog.put("Thoracic / Back Supports", new CategorySeed(4, List.of(
            "Taylor's Brace",
            "Contoured Spinal Brace",
            "Scoliosis Support",
            "Sternal Splint",
            "Hyper Extension Support"
        )));
        catalog.put("Spine Supports", new CategorySeed(4, List.of(
            "Lumbar Sacral Contoured Belt (Double Support)",
            "Neoprene High Lumbar Sacro Belt (Double Support)",
            "Sacroiliac Belt",
            "Lumbar Posture Brace (Porous Elastic)",
            "Orthopaedic Back Rest (High/Short)",
            "Adjustable Back Rest For Use On Bed"
        )));
        catalog.put("Waist / Abdominal Supports", new CategorySeed(5, List.of(
            "Maternity Belt",
            "Neoprene Abdominal Support",
            "Abdominal Binder",
            "Pelvic Binder",
            "Colostomy Abdominal Belt"
        )));
        catalog.put("Knee Supports", new CategorySeed(5, List.of(
            "Neoprene Knee Support",
            "Knee Immobiliser Short",
            "Knee Immobiliser Long",
            "Neoprene Hinged Knee Brace (ACL/PCL)",
            "Post Operative Knee Brace (ROM)",
            "Neoprene Open Patella Knee Brace",
            "Neoprene Valgus Knee Support",
            "AK Artificial Limb TES Belt",
            "AK Bilateral Artificial Limb TES Belt",
            "Neoprene OA Hinged Knee Support",
            "Elastic Knee Cap",
            "Neoprene Spiral Knee Brace",
            "Neoprene Varus Knee Support",
            "BK Artificial Limb TES Belt",
            "KAFO Knee Support"
        )));
        catalog.put("Ankle Orthosis", new CategorySeed(7, List.of(
            "Neoprene Fig 8 Anklet",
            "Ankle Stabilizer",
            "Ankle Fracture Splint",
            "Walking Casting Shoe",
            "Ankle Night Splint (D Rotation Boot)",
            "Hallux Valgus Splint",
            "Foot Drop Splint",
            "Customised Foot Thumb Toe Immobiliser",
            "Dorsal Night Splint",
            "Ankle Walker Boot",
            "Tibial Brace"
        )));
        catalog.put("Silicon Products", new CategorySeed(7, List.of(
            "Toe Separator / Ring Type",
            "Heel Cup",
            "Insole with Arch",
            "Heel Strap",
            "Artificial Silicon Breast"
        )));
        catalog.put("Exercising Aids", new CategorySeed(8, List.of(
            "Silicon Exercise Ball",
            "Weight Cuff (1/2kg, 1kg, 2kg up to 6kg)",
            "Thera Band"
        )));
        catalog.put("Coccyx Cushions / Pillows", new CategorySeed(8, List.of(
            "Coccyx Cushion Square / Round"
        )));
        catalog.put("Medical Compression Stockings", new CategorySeed(8, List.of(
            "Varicose Vein Stocking up to Knee",
            "Varicose Vein Stocking up to Thigh",
            "Compression Arm Sleeve",
            "Anti Embolism Knee Length",
            "Anti Embolism Stocking up to Thigh",
            "Pneumatic Compression Medical Device (For Leg & Hand)",
            "Grip Bandage"
        )));
        catalog.put("Medical Compression Straps", new CategorySeed(9, List.of(
            "Lymphedema Straps",
            "Lymphedema Straps (Thigh Level)",
            "Lymphedema Arm Straps"
        )));
        catalog.put("Pediatric Orthosis", new CategorySeed(9, List.of(
            "Child Cervical Collar",
            "Child Arm Sling Pouch",
            "Weight Jacket",
            "Child Weight Cuffs",
            "Child Customised Spinal Brace",
            "Torticollis Brace",
            "Head Holder"
        )));
        catalog.put("Medical Compression Garments", new CategorySeed(10, List.of(
            "Post Liposuction Garment",
            "Burn Garments",
            "Head / Chin / Cervical Strap",
            "Full Hand Stocking (Upper Limb)",
            "Liposuction Garment (Male/Female)",
            "Leg Stocking (Lower Limb)",
            "Below Knee Stocking"
        )));
        catalog.put("Rehabilitation Aids", new CategorySeed(11, List.of(
            "Gutter Walker",
            "Axillary Crutches",
            "Non-Foldable Walker",
            "Foldable Walker (Aluminium)",
            "Foldable Walker Steel Powder Coated",
            "Elbow Crutch Steel Powder Coated",
            "Elbow Crutch (Aluminium)",
            "Tripod Adjustable Walking Stick (Aluminium)",
            "Adjustable Walking Stick (Aluminium)",
            "Adjustable Steel Powder Coated Walking Stick",
            "Quadripad Adjustable Walking Stick (Aluminium)"
        )));

        catalog.forEach((category, seed) -> seed.products().forEach(name -> saveProduct(category, seed.page(), name)));
    }

    private void saveProduct(String category, int page, String name) {
        int productPage = pageOverrides().getOrDefault(name, page);
        String id = slug(category + "-" + name);
        String pageNumber = "%02d".formatted(productPage);
        productRepository.save(new Product(
            id,
            name,
            category,
            DEFAULT_COST,
            "Active",
            ProductUseDescriptions.forProduct(name),
            productPage,
            "/assets/products/" + id + ".jpg",
            "/rendered/page-" + pageNumber + ".png"
        ));
    }

    private Map<String, Integer> pageOverrides() {
        return Map.ofEntries(
            Map.entry("Static Cock Up Splint", 3),
            Map.entry("Thumb Spica Splint", 3),
            Map.entry("Hand ROM Brace", 3),
            Map.entry("Carpal Tunnel Splint", 3),
            Map.entry("Orthopaedic Back Rest (High/Short)", 5),
            Map.entry("Adjustable Back Rest For Use On Bed", 5),
            Map.entry("Post Operative Knee Brace (ROM)", 6),
            Map.entry("Neoprene Open Patella Knee Brace", 6),
            Map.entry("Neoprene Valgus Knee Support", 6),
            Map.entry("AK Artificial Limb TES Belt", 6),
            Map.entry("AK Bilateral Artificial Limb TES Belt", 6),
            Map.entry("Neoprene OA Hinged Knee Support", 6),
            Map.entry("Elastic Knee Cap", 6),
            Map.entry("Neoprene Spiral Knee Brace", 6),
            Map.entry("Neoprene Varus Knee Support", 6),
            Map.entry("BK Artificial Limb TES Belt", 6),
            Map.entry("KAFO Knee Support", 6),
            Map.entry("Heel Strap", 8),
            Map.entry("Artificial Silicon Breast", 8),
            Map.entry("Anti Embolism Stocking up to Thigh", 9),
            Map.entry("Pneumatic Compression Medical Device (For Leg & Hand)", 9),
            Map.entry("Grip Bandage", 9)
        );
    }

    private String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
    }

    private record CategorySeed(int page, List<String> products) {
    }
}
