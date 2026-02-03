-- Initial tags with keywords for auto-tagging

-- Insert tags
INSERT INTO tags (name) VALUES
    ('AI'),
    ('Web Development'),
    ('Mobile'),
    ('Cloud'),
    ('Security'),
    ('DevOps'),
    ('Database'),
    ('Frontend'),
    ('Backend'),
    ('Machine Learning');

-- Insert keywords for each tag
INSERT INTO tag_keywords (tag_id, keyword)
SELECT t.id, k.keyword
FROM tags t
CROSS JOIN (
    VALUES
        ('AI', 'artificial intelligence'),
        ('AI', 'ChatGPT'),
        ('AI', 'LLM'),
        ('AI', 'GPT'),
        ('AI', 'Claude'),
        ('AI', 'Gemini'),
        ('Web Development', 'React'),
        ('Web Development', 'Vue'),
        ('Web Development', 'Angular'),
        ('Web Development', 'Next.js'),
        ('Web Development', 'Remix'),
        ('Mobile', 'iOS'),
        ('Mobile', 'Android'),
        ('Mobile', 'React Native'),
        ('Mobile', 'Flutter'),
        ('Mobile', 'Swift'),
        ('Mobile', 'Kotlin'),
        ('Cloud', 'AWS'),
        ('Cloud', 'Azure'),
        ('Cloud', 'GCP'),
        ('Cloud', 'Vercel'),
        ('Cloud', 'Cloudflare'),
        ('Security', 'vulnerability'),
        ('Security', 'CVE'),
        ('Security', 'authentication'),
        ('Security', 'encryption'),
        ('DevOps', 'Docker'),
        ('DevOps', 'Kubernetes'),
        ('DevOps', 'CI/CD'),
        ('DevOps', 'GitHub Actions'),
        ('DevOps', 'Terraform'),
        ('Database', 'PostgreSQL'),
        ('Database', 'MySQL'),
        ('Database', 'MongoDB'),
        ('Database', 'Redis'),
        ('Database', 'Supabase'),
        ('Frontend', 'CSS'),
        ('Frontend', 'Tailwind'),
        ('Frontend', 'TypeScript'),
        ('Frontend', 'JavaScript'),
        ('Backend', 'Node.js'),
        ('Backend', 'Python'),
        ('Backend', 'Go'),
        ('Backend', 'Rust'),
        ('Backend', 'API'),
        ('Machine Learning', 'TensorFlow'),
        ('Machine Learning', 'PyTorch'),
        ('Machine Learning', 'neural network'),
        ('Machine Learning', 'deep learning'),
        ('Machine Learning', 'transformer')
) AS k(tag_name, keyword)
WHERE t.name = k.tag_name;
