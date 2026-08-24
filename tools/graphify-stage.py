import json
import sys
from pathlib import Path

from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.detect import detect
from graphify.export import to_html, to_json
from graphify.extract import collect_files, extract
from graphify.report import generate


def label_communities(graph, communities):
    labels = {}
    for community_id, node_ids in communities.items():
        candidates = []
        for node_id in node_ids:
            data = graph.nodes[node_id]
            source = str(data.get("source_file", "")).replace("\\", "/")
            label = str(data.get("label", node_id))
            parts = [part for part in source.split("/") if part]
            if "modules" in parts:
                index = parts.index("modules")
                if index + 1 < len(parts):
                    candidates.append(parts[index + 1])
            elif len(parts) >= 2:
                candidates.append(parts[-2])
            elif label:
                candidates.append(label.split(".")[0])
        if candidates:
            winner = max(set(candidates), key=lambda value: (candidates.count(value), -len(value)))
            labels[community_id] = winner.replace("-", " ").replace("_", " ").title()[:50]
        else:
            labels[community_id] = f"Community {community_id}"
    return labels


def main():
    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    semantic_path = Path(sys.argv[3]).resolve() if len(sys.argv) > 3 else None
    output_path.mkdir(parents=True, exist_ok=True)

    detection = detect(input_path)
    (output_path / ".graphify_detect.json").write_text(
        json.dumps(detection, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    code_files = []
    for item in detection.get("files", {}).get("code", []):
        candidate = Path(item)
        code_files.extend(collect_files(candidate) if candidate.is_dir() else [candidate])

    ast = extract(code_files) if code_files else {
        "nodes": [], "edges": [], "input_tokens": 0, "output_tokens": 0
    }
    (output_path / ".graphify_ast.json").write_text(
        json.dumps(ast, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    semantic = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}
    if semantic_path and semantic_path.exists():
        semantic = json.loads(semantic_path.read_text(encoding="utf-8"))

    seen = {node["id"] for node in ast.get("nodes", [])}
    merged_nodes = list(ast.get("nodes", []))
    for node in semantic.get("nodes", []):
        if node.get("id") and node["id"] not in seen:
            merged_nodes.append(node)
            seen.add(node["id"])

    merged = {
        "nodes": merged_nodes,
        "edges": ast.get("edges", []) + semantic.get("edges", []),
        "hyperedges": semantic.get("hyperedges", []),
        "input_tokens": semantic.get("input_tokens", 0),
        "output_tokens": semantic.get("output_tokens", 0),
    }
    (output_path / ".graphify_extract.json").write_text(
        json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    graph = build_from_json(merged)
    if graph.number_of_nodes() == 0:
        raise SystemExit("Graph is empty; extraction produced no nodes.")

    communities = cluster(graph)
    cohesion = score_all(graph, communities)
    labels = label_communities(graph, communities)
    gods = god_nodes(graph)
    surprises = surprising_connections(graph, communities)
    questions = suggest_questions(graph, communities, labels)
    tokens = {"input": merged.get("input_tokens", 0), "output": merged.get("output_tokens", 0)}
    report = generate(
        graph,
        communities,
        cohesion,
        labels,
        gods,
        surprises,
        detection,
        tokens,
        str(input_path),
        suggested_questions=questions,
    )
    (output_path / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(graph, communities, str(output_path / "graph.json"))
    analysis = {
        "communities": {str(key): value for key, value in communities.items()},
        "cohesion": {str(key): value for key, value in cohesion.items()},
        "labels": {str(key): value for key, value in labels.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    (output_path / ".graphify_analysis.json").write_text(
        json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    html_written = False
    if graph.number_of_nodes() <= 5000:
        to_html(graph, communities, str(output_path / "graph.html"), community_labels=labels)
        html_written = True
    print(json.dumps({
        "input": str(input_path),
        "files": detection.get("total_files", 0),
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "communities": len(communities),
        "htmlWritten": html_written,
    }))


if __name__ == "__main__":
    main()
